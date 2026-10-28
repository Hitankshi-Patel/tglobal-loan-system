import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  calculateGoldMetrics,
  calculateEligibleLoan,
  getRate24k,
  type PlanQuote,
} from '../lib/calculator.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const quoteSchema = z.object({
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
  planId: z.string().optional(),
});

/**
 * POST /api/v1/quotes
 * Pure calculation with NO DB write. Returns pure gold, gold value and eligible loan per plan.
 */
router.post('/', async (req, res, next) => {
  try {
    const parseResult = quoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw parseResult.error;
    }

    const { netWeightGrams, grossWeightGrams, karat, planId } = parseResult.data;

    // Validation: 0 < net <= gross <= 1000 g
    if (grossWeightGrams !== undefined && netWeightGrams > grossWeightGrams) {
      throw new AppError(
        400,
        'INVALID_WEIGHT_RELATION',
        'Net weight cannot exceed gross weight',
        ['netWeightGrams']
      );
    }

    // Pure calculation
    const rate24k = getRate24k();
    const metrics = calculateGoldMetrics(netWeightGrams, karat, rate24k);

    // Fetch active schemes from DB
    const schemes = await prisma.loanScheme.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });

    if (planId) {
      const specificPlan = schemes.find((s) => s.id === planId);
      if (!specificPlan) {
        throw new AppError(
          404,
          'PLAN_NOT_FOUND',
          `Loan scheme with id '${planId}' was not found.`,
          ['planId']
        );
      }
    }

    const quotes: PlanQuote[] = schemes.map((plan) => {
      const { eligibleLoan, eligibleLoanPaise } = calculateEligibleLoan(
        metrics.goldValue,
        plan.maxLtv
      );

      return {
        planId: plan.id,
        planName: plan.name,
        interestRateAnnual: plan.interestRateAnnual,
        maxLtv: Math.min(plan.maxLtv, 0.75),
        tenureMonths: plan.tenureMonths,
        tenureDescription: plan.tenureDescription,
        eligibleLoan,
        eligibleLoanPaise,
      };
    });

    // If specific plan was requested, extract its eligible loan for convenience
    let selectedQuote = quotes.find((q) => q.planId === planId);
    if (!selectedQuote && quotes.length > 0) {
      selectedQuote = quotes[0];
    }

    res.status(200).json({
      netWeightGrams: metrics.netWeightGrams,
      grossWeightGrams: grossWeightGrams ?? netWeightGrams,
      karat: metrics.karat,
      rate24kPerGram: metrics.rate24kPerGram,
      pureGoldGrams: metrics.pureGoldGrams,
      goldValue: metrics.goldValue,
      eligibleLoan: selectedQuote?.eligibleLoan ?? 0,
      quotes: quotes.map(({ eligibleLoanPaise, ...rest }) => rest),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
