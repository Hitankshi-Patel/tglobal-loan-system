export interface CalculationResult {
  netWeightGrams: number;
  karat: 18 | 22 | 24;
  rate24kPerGram: number;
  pureGoldGrams: number;
  goldValue: number;
  goldValuePaise: bigint;
}

export interface PlanQuote {
  planId: string;
  planName: string;
  interestRateAnnual: number;
  maxLtv: number;
  tenureMonths: number;
  tenureDescription: string;
  eligibleLoan: number;
  eligibleLoanPaise: bigint;
}

export function getRate24k(): number {
  const envRate = process.env.RATE_24K_PER_GRAM;
  return envRate ? Number(envRate) : 7000;
}

export function calculateGoldMetrics(
  netWeightGrams: number,
  karat: 18 | 22 | 24,
  rate24kPerGram: number = getRate24k()
): CalculationResult {
  // pureGoldGrams = netWeightGrams x (karat / 24)
  const rawPureGold = (netWeightGrams * karat) / 24;
  // Format to 2 decimal places precision
  const pureGoldGrams = Math.round(rawPureGold * 100) / 100;

  // goldValue = pureGoldGrams x rate24kPerGram
  const rawGoldValue = pureGoldGrams * rate24kPerGram;
  const goldValue = Math.round(rawGoldValue * 100) / 100;

  // Stored as integer paise (1 Rupee = 100 paise)
  const goldValuePaise = BigInt(Math.round(goldValue * 100));

  return {
    netWeightGrams,
    karat,
    rate24kPerGram,
    pureGoldGrams,
    goldValue,
    goldValuePaise,
  };
}

export function calculateEligibleLoan(
  goldValue: number,
  maxLtv: number
): { eligibleLoan: number; eligibleLoanPaise: bigint } {
  // eligibleLoan = floor( goldValue x min(plan.maxLtv, 0.75) )
  const cappedLtv = Math.min(maxLtv, 0.75);
  const eligibleLoan = Math.floor(goldValue * cappedLtv);
  const eligibleLoanPaise = BigInt(eligibleLoan * 100);

  return { eligibleLoan, eligibleLoanPaise };
}

export function maskMobileNumber(mobile: string): string {
  if (!mobile || mobile.length < 10) return mobile;
  return `${mobile.slice(0, 2)}XXXX${mobile.slice(-4)}`;
}
