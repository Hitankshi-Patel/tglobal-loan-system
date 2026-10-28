import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';

interface ApplyMethodSelectionProps {
  onSelectForm?: () => void;
  onSelectAi?: () => void;
}

/**
 * ApplyMethodSelection
 * Built using the Golden Ratio (phi = 1.618, Fibonacci spacing: 8, 13, 21, 34, 55, 89)
 * Clean, balanced icon presentation matching reference design without awkward pill bars.
 */
export const ApplyMethodSelection: React.FC<ApplyMethodSelectionProps> = ({
  onSelectForm,
  onSelectAi,
}) => {
  const navigate = useNavigate();
  const handleForm = onSelectForm || (() => navigate('/apply/form'));
  const handleAi = onSelectAi || (() => navigate('/apply/chat'));
  return (
    <div className="w-full max-w-4xl mx-auto px-5 sm:px-8 py-8 sm:py-12 animate-in fade-in duration-300">
      {/* Header section with golden ratio typography scale */}
      <div className="text-left mb-8 sm:mb-9">
        <h2 className="text-2xl sm:text-[34px] font-extrabold text-[#0f1914] tracking-tight leading-[1.2]">
          Get a gold loan in minutes
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#4a5b52] font-normal leading-relaxed">
          Choose whichever application method is more convenient for you.
        </p>
      </div>

      {/* Two Method Cards Grid - Golden ratio proportions (width:height ~ 1.618) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
        {/* Option 1: Apply with a form */}
        <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-emerald-100 shadow-[0_8px_30px_rgba(8,67,42,0.05)] hover:shadow-[0_16px_40px_rgba(8,67,42,0.1)] transition-all duration-300 flex flex-col justify-between group min-h-[300px]">
          <div>
            {/* Clean Icon Badge with Golden Ratio sizing (55px container, 34px icon visual) */}
            <div className="w-[52px] h-[52px] rounded-[18px] bg-[#eef8f2] text-[#08432a] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200 border border-emerald-100/80 shadow-2xs">
              <ClipboardList className="w-7 h-7 stroke-[2]" />
            </div>

            <h3 className="text-xl sm:text-[22px] font-bold text-[#0f1914] tracking-tight">
              Apply with a form
            </h3>

            <p className="mt-2.5 text-sm sm:text-[15px] text-[#4a5b52] leading-relaxed font-normal">
              Enter your gold details, see your eligible loan, and submit.
            </p>
          </div>

          <button
            type="button"
            onClick={handleForm}
            className="mt-8 w-full bg-[#08432a] hover:bg-[#053220] active:scale-[0.98] text-white font-semibold h-[52px] px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md transition-all text-[15px] cursor-pointer"
          >
            <span>Start application</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>

        {/* Option 2: Apply with AI */}
        <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-emerald-100 shadow-[0_8px_30px_rgba(8,67,42,0.05)] hover:shadow-[0_16px_40px_rgba(8,67,42,0.1)] transition-all duration-300 flex flex-col justify-between group min-h-[300px]">
          <div>
            {/* Clean Icon Badge with Golden Ratio sizing */}
            <div className="w-[52px] h-[52px] rounded-[18px] bg-[#eef8f2] text-[#08432a] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200 border border-emerald-100/80 shadow-2xs">
              <MessageSquare className="w-7 h-7 stroke-[2]" />
            </div>

            <h3 className="text-xl sm:text-[22px] font-bold text-[#0f1914] tracking-tight">
              Apply with AI
            </h3>

            <p className="mt-2.5 text-sm sm:text-[15px] text-[#4a5b52] leading-relaxed font-normal">
              Chat naturally to check eligibility and complete your application.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAi}
            className="mt-8 w-full bg-white hover:bg-[#f2faf5] active:scale-[0.98] text-[#08432a] border border-[#08432a] font-semibold h-[52px] px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xs hover:shadow transition-all text-[15px] cursor-pointer"
          >
            <span>Chat with AI</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Bottom Disclaimer in Golden Ratio proportion */}
      <div className="mt-8 sm:mt-9 flex items-center gap-2 text-xs sm:text-[13px] text-[#55695e]">
        <ShieldCheck className="w-4 h-4 text-[#08432a] flex-shrink-0" />
        <span>Both methods use the same verified loan calculations and application system.</span>
      </div>
    </div>
  );
};
