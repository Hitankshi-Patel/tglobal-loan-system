import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Percent, 
  Calendar, 
  CheckCircle2, 
  Calculator, 
  RefreshCw 
} from 'lucide-react';

interface Scheme {
  id: string;
  name: string;
  interestRateAnnual: number;
  maxLtv: number;
  tenureMonths: number;
  tenureDescription: string;
}

export const LoanSchemesPage: React.FC = () => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [calcWeight, setCalcWeight] = useState<number | ''>(50);
  const [calcKarat, setCalcKarat] = useState<18 | 22 | 24>(22);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/loan-schemes');
      if (res.ok) {
        const data = await res.json();
        setSchemes(data.schemes || []);
      }
    } catch (err) {
      console.warn('Failed to fetch schemes from backend, using default fallback:', err);
      setSchemes([
        {
          id: 'PLAN_BULLET_01',
          name: 'Bullet Repayment',
          interestRateAnnual: 12,
          maxLtv: 0.7,
          tenureMonths: 12,
          tenureDescription: '12 months, interest + principal at maturity',
        },
        {
          id: 'PLAN_EMI_01',
          name: 'Monthly EMI',
          interestRateAnnual: 10.5,
          maxLtv: 0.75,
          tenureMonths: 12,
          tenureDescription: '12 months, equal monthly instalments',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  // Quick estimator calculations
  const weightNum = typeof calcWeight === 'number' ? calcWeight : 0;
  const purityMultiplier = calcKarat === 18 ? 18 / 24 : calcKarat === 22 ? 22 / 24 : 1;
  const pureGold = weightNum * purityMultiplier;
  const goldValue = pureGold * 7000;

  const formatCurrency = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  return (
    <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-bold text-[#08432a] bg-[#d8f2e4] px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-block mb-3">
          RBI Compliant NBFC Schemes
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-[#0f1914] tracking-tight">
          Transparent Gold Loan Plans
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#4a5b52] leading-relaxed">
          Choose between flexible bullet repayment at maturity or budget-friendly monthly EMIs with maximum statutory LTV up to 75%.
        </p>
      </div>

      {/* Schemes Grid (Fetched from DB) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {loading ? (
          <div className="col-span-2 py-16 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#08432a] mb-3" />
            <span>Loading active loan schemes from database...</span>
          </div>
        ) : (
          schemes.map((scheme) => {
            const isBullet = scheme.id.includes('BULLET');
            const eligibleForCalc = Math.round(goldValue * scheme.maxLtv);

            return (
              <div
                key={scheme.id}
                className="bg-white rounded-3xl p-7 sm:p-9 border border-emerald-100 shadow-[0_10px_35px_rgba(8,67,42,0.06)] hover:shadow-[0_16px_45px_rgba(8,67,42,0.1)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-[#08432a] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      {scheme.id}
                    </span>
                    {isBullet && (
                      <span className="text-xs font-bold text-[#08432a] bg-[#c8eed9] px-2.5 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-[#0f1914] tracking-tight">
                    {scheme.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4a5b52] mt-1 mb-6">
                    {scheme.tenureDescription}
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#f8fcf9] border border-emerald-100 mb-6">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                        <Percent className="w-3.5 h-3.5 text-[#08432a]" />
                        <span>Annual Interest</span>
                      </div>
                      <span className="text-2xl font-black text-[#0f1914]">
                        {scheme.interestRateAnnual}%
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#08432a]" />
                        <span>Max LTV</span>
                      </div>
                      <span className="text-2xl font-black text-[#07643b]">
                        {Math.round(scheme.maxLtv * 100)}%
                      </span>
                    </div>

                    <div className="col-span-2 pt-2 border-t border-emerald-100/80 flex items-center justify-between text-xs text-[#44564c]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#08432a]" />
                        <span>Tenure</span>
                      </span>
                      <span className="font-semibold text-[#0f1914]">{scheme.tenureMonths} Months</span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2.5 text-xs sm:text-sm text-[#44564c] mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#08432a] flex-shrink-0" />
                      <span>Zero prepayment penalty after 3 months</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#08432a] flex-shrink-0" />
                      <span>Doorstep valuation or at any authorized branch</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#08432a] flex-shrink-0" />
                      <span>Free vault custody with 100% insurance coverage</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  {weightNum > 0 && (
                    <div className="mb-4 flex items-center justify-between text-xs bg-emerald-50/70 p-3 rounded-xl">
                      <span className="text-[#44564c]">Estimated for {weightNum}g ({calcKarat}K):</span>
                      <span className="font-bold text-sm text-[#07643b]">{formatCurrency(eligibleForCalc)}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate('/apply/form')}
                    className="w-full bg-[#08432a] hover:bg-[#053220] active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Apply Under {scheme.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Live Calculator Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-9 border border-emerald-100 shadow-[0_8px_30px_rgba(8,67,42,0.05)]">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="p-2 bg-[#d8f2e4] text-[#08432a] rounded-xl">
            <Calculator className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-[#0f1914]">Quick Loan Estimator</h3>
            <p className="text-xs text-gray-500">Live calculations based on standard ₹7,000/g 24K valuation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-xs font-bold text-[#0f1914] mb-2 uppercase tracking-wider">
              Gold Weight (Grams)
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={calcWeight}
              onChange={(e) => setCalcWeight(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 50"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#08432a] focus:ring-2 focus:ring-[#08432a]/15 outline-none text-base font-semibold text-[#0f1914]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0f1914] mb-2 uppercase tracking-wider">
              Purity (Karat)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([18, 22, 24] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCalcKarat(k)}
                  className={`py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    calcKarat === k
                      ? 'bg-[#08432a] text-white border-[#08432a]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {k}K
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => navigate('/apply/form')}
              className="w-full bg-[#08432a] hover:bg-[#053220] active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Apply for {formatCurrency(goldValue * 0.75)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
