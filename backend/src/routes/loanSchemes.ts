import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/v1/loan-schemes
 * Returns active plans with id, name, annual interest rate, tenure and max LTV (never above 75%).
 */
router.get('/', async (_req, res, next) => {
  try {
    const rawSchemes = await prisma.loanScheme.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });

    const schemes = rawSchemes.map((s) => ({
      id: s.id,
      name: s.name,
      interestRateAnnual: s.interestRateAnnual,
      maxLtv: Math.min(s.maxLtv, 0.75),
      tenureMonths: s.tenureMonths,
      tenureDescription: s.tenureDescription,
    }));

    res.status(200).json({ schemes });
  } catch (error) {
    next(error);
  }
});

export default router;
