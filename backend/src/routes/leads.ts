import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  calculateGoldMetrics,
  calculateEligibleLoan,
  getRate24k,
  maskMobileNumber,
} from '../lib/calculator.js';
import { keyedMutex } from '../lib/lock.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const createLeadSchema = z.object({
  fullName: z
    .string({ required_error: 'fullName is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain letters and spaces only'),
  mobileNumber: z
    .string({ required_error: 'mobileNumber is required' })
    .regex(/^[6-9]\d{9}$/, 'Mobile number must be a valid 10-digit Indian number starting with 6-9'),
  netWeightGrams: z
    .number({ required_error: 'netWeightGrams is required' })
    .positive('netWeightGrams must be greater than 0')
    .max(1000, 'netWeightGrams must be at most 1000 g'),
  grossWeightGrams: z
    .number()
    .positive('grossWeightGrams must be greater than 0')
    .max(1000, 'grossWeightGrams must be at most 1000 g')
    .optional(),
  karat: z.union([z.literal(18), z.literal(22), z.literal(24)], {
    errorMap: () => ({ message: 'Karat must be one of 18, 22, or 24' }),
  }),
  planId: z.string({ required_error: 'planId is required' }),
});

function generateApplicationId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `APP-${dateStr}-${randomSuffix}`;
}

function formatLeadResponse(lead: any) {
  return {
    applicationId: lead.applicationId,
    status: lead.status,
    fullName: lead.fullName,
    mobileNumber: maskMobileNumber(lead.mobileNumber),
    netWeightGrams: Number(lead.netWeightGrams),
    grossWeightGrams: Number(lead.grossWeightGrams),
    karat: lead.karat,
    planId: lead.planId,
    pureGoldGrams: Number(lead.pureGoldGrams),
    goldValue: Number(lead.goldValuePaise) / 100,
    eligibleLoan: Number(lead.eligibleLoanPaise) / 100,
    createdAt: lead.createdAt instanceof Date ? lead.createdAt.toISOString() : lead.createdAt,
    updatedAt: lead.updatedAt instanceof Date ? lead.updatedAt.toISOString() : lead.updatedAt,
  };
}

/**
 * POST /api/v1/leads
 * Validates, re-computes quote server-side, de-duplicates within 7 days,
 * supports Idempotency-Key, stores with status SUBMITTED, and returns 201.
 */
router.post('/', async (req, res, next) => {
  let releaseLock: (() => void) | null = null;
  try {
    // 1. Check Idempotency-Key header for duplicate request replay
    const rawIdempotencyKey = req.header('idempotency-key') || req.header('Idempotency-Key');
    const idempotencyKey = rawIdempotencyKey?.trim();

    if (idempotencyKey) {
      const existingIdempotentLead = await prisma.lead.findUnique({
        where: { idempotencyKey },
      });
      if (existingIdempotentLead) {
        // Return original 201 response replayed
        res.status(201).json(formatLeadResponse(existingIdempotentLead));
        return;
      }
    }

    // 2. Validate request body with Zod
    const parseResult = createLeadSchema.safeParse(req.body);
    if (!parseResult.success) {
      // Map first error to field name
      const firstIssue = parseResult.error.issues[0];
      const field = firstIssue?.path[0]?.toString() || '';
      throw new AppError(400, 'VALIDATION_ERROR', firstIssue.message, [field]);
    }

    const { fullName, mobileNumber, netWeightGrams, grossWeightGrams, karat, planId } =
      parseResult.data;

    const effectiveGross = grossWeightGrams ?? netWeightGrams;

    // Weight validation: 0 < net <= gross <= 1000
    if (netWeightGrams > effectiveGross) {
      throw new AppError(
        400,
        'INVALID_WEIGHT_RELATION',
        'Net weight cannot exceed gross weight',
        ['netWeightGrams']
      );
    }

    // 3. Acquire key mutex lock per mobile number to prevent race conditions on simultaneous parallel submissions
    releaseLock = await keyedMutex.acquire(mobileNumber);

    // 4. Duplicate check: Same mobile within 7 days returns 409 Conflict with existing applicationId
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const existingRecentLead = await prisma.lead.findFirst({
      where: {
        mobileNumber,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingRecentLead) {
      throw new AppError(
        409,
        'DUPLICATE_APPLICATION',
        'An application for this mobile number was already submitted within the last 7 days.',
        ['mobileNumber'],
        { existingApplicationId: existingRecentLead.applicationId }
      );
    }

    // 5. Verify plan exists in DB (else 404)
    const scheme = await prisma.loanScheme.findUnique({
      where: { id: planId },
    });

    if (!scheme || !scheme.isActive) {
      throw new AppError(
        404,
        'PLAN_NOT_FOUND',
        `Loan scheme with id '${planId}' does not exist or is inactive.`,
        ['planId']
      );
    }

    // 6. Server-side quote computation (never trust client numbers)
    const metrics = calculateGoldMetrics(netWeightGrams, karat, getRate24k());
    const { eligibleLoan, eligibleLoanPaise } = calculateEligibleLoan(
      metrics.goldValue,
      scheme.maxLtv
    );

    // 7. Generate Application ID and save Lead with AuditLog in transaction
    const applicationId = generateApplicationId();

    const createdLead = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          applicationId,
          fullName: fullName.trim(),
          mobileNumber,
          netWeightGrams,
          grossWeightGrams: effectiveGross,
          karat,
          planId: scheme.id,
          pureGoldGrams: metrics.pureGoldGrams,
          goldValuePaise: metrics.goldValuePaise,
          eligibleLoanPaise,
          status: 'SUBMITTED',
          idempotencyKey: idempotencyKey || null,
        },
      });

      // Audit Log for status workflow
      await tx.auditLog.create({
        data: {
          leadId: applicationId,
          previousStatus: null,
          newStatus: 'SUBMITTED',
          note: 'Application received and quote verified server-side',
          changedBy: 'SYSTEM',
        },
      });

      return lead;
    });

    res.status(201).json(formatLeadResponse(createdLead));
  } catch (error) {
    next(error);
  } finally {
    if (releaseLock) {
      releaseLock();
    }
  }
});

/**
 * GET /api/v1/leads
 * Returns all leads, newest first. Mobile numbers are always masked. Supports pagination.
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { plan: true },
      }),
      prisma.lead.count(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      leads: leads.map(formatLeadResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * BONUS: Status workflow transition
 * PATCH /api/v1/leads/:id/status
 * Transitions status (SUBMITTED -> UNDER_REVIEW -> APPROVED / REJECTED) with audit log.
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note, changedBy } = req.body;

    const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      throw new AppError(
        400,
        'INVALID_STATUS',
        `Status must be one of: ${validStatuses.join(', ')}`,
        ['status']
      );
    }

    const lead = await prisma.lead.findUnique({
      where: { applicationId: id },
    });

    if (!lead) {
      throw new AppError(404, 'LEAD_NOT_FOUND', `Lead '${id}' not found.`, ['id']);
    }

    const previousStatus = lead.status;

    const updatedLead = await prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { applicationId: id },
        data: { status },
      });

      await tx.auditLog.create({
        data: {
          leadId: id,
          previousStatus,
          newStatus: status,
          note: note || `Status changed from ${previousStatus} to ${status}`,
          changedBy: changedBy || 'ADMIN',
        },
      });

      return updated;
    });

    res.status(200).json(formatLeadResponse(updatedLead));
  } catch (error) {
    next(error);
  }
});

/**
 * BONUS: GET /api/v1/leads/:id/audit-logs
 * Returns audit log trail for compliance.
 */
router.get('/:id/audit-logs', async (req, res, next) => {
  try {
    const { id } = req.params;

    const auditLogs = await prisma.auditLog.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ auditLogs });
  } catch (error) {
    next(error);
  }
});

export default router;
