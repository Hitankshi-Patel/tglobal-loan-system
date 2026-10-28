/**
 * Admin Routes
 * POST /api/v1/admin/login          - Authenticate with credentials, get JWT
 * GET  /api/v1/admin/leads          - Protected: list all leads (with full data)
 * GET  /api/v1/admin/leads/:id/audit-logs - Protected: audit trail
 */

import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { maskMobileNumber } from '../lib/calculator.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireAdminAuth } from '../middleware/auth.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'tglobal-admin-secret-change-in-prod';
const JWT_EXPIRY = '8h';

/**
 * POST /api/v1/admin/login
 * Validates credentials from environment, issues a signed JWT.
 */
router.post('/login', (req, res, next) => {
  try {
    const { username, password } = z.object({
      username: z.string({ required_error: 'username is required' }),
      password: z.string({ required_error: 'password is required' }),
    }).parse(req.body);

    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'tglobal@admin2024';

    if (username !== adminUser || password !== adminPass) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid username or password.', []);
    }

    const payload = { username, role: 'admin' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    res.status(200).json({
      success: true,
      token,
      expiresIn: JWT_EXPIRY,
      username,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/leads
 * Protected admin route — returns all leads with pagination.
 * Mobile numbers are masked in the response (same spec as public endpoint).
 */
router.get('/leads', requireAdminAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const planFilter = req.query.planId as string | undefined;
    const statusFilter = req.query.status as string | undefined;

    const where: Record<string, any> = {};
    if (planFilter) where.planId = planFilter;
    if (statusFilter) where.status = statusFilter;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { plan: true },
      }),
      prisma.lead.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const formattedLeads = leads.map((lead) => ({
      applicationId: lead.applicationId,
      status: lead.status,
      fullName: lead.fullName,
      mobileNumber: maskMobileNumber(lead.mobileNumber),
      netWeightGrams: Number(lead.netWeightGrams),
      grossWeightGrams: Number(lead.grossWeightGrams),
      karat: lead.karat,
      planId: lead.planId,
      planName: (lead as any).plan?.name,
      pureGoldGrams: Number(lead.pureGoldGrams),
      goldValue: Number(lead.goldValuePaise) / 100,
      eligibleLoan: Number(lead.eligibleLoanPaise) / 100,
      createdAt: lead.createdAt instanceof Date ? lead.createdAt.toISOString() : lead.createdAt,
      updatedAt: lead.updatedAt instanceof Date ? lead.updatedAt.toISOString() : lead.updatedAt,
    }));

    res.status(200).json({
      leads: formattedLeads,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/admin/leads/:id/audit-logs
 * Protected — full audit trail for a single lead.
 */
router.get('/leads/:id/audit-logs', requireAdminAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({ where: { applicationId: id } });
    if (!lead) {
      throw new AppError(404, 'LEAD_NOT_FOUND', `Lead '${id}' not found.`, ['id']);
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ auditLogs });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/admin/leads/:id/status
 * Protected — update lead status with audit trail.
 */
router.patch('/leads/:id/status', requireAdminAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const changedBy = (req as any).admin?.username || 'ADMIN';

    const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      throw new AppError(400, 'INVALID_STATUS', `Status must be one of: ${validStatuses.join(', ')}`, ['status']);
    }

    const lead = await prisma.lead.findUnique({ where: { applicationId: id } });
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
          changedBy,
        },
      });
      return updated;
    });

    res.status(200).json({
      applicationId: updatedLead.applicationId,
      status: updatedLead.status,
      updatedAt: updatedLead.updatedAt instanceof Date ? updatedLead.updatedAt.toISOString() : updatedLead.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
