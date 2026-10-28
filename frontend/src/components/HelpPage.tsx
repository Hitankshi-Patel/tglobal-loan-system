import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileCheck, 
  ShieldCheck, 
  Clock, 
  ChevronDown
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  const faqs = [
    {
      q: 'What documents are required to apply for a TGlobal gold loan?',
      a: 'We keep documentation minimal: (1) Identity Proof (Aadhaar Card, PAN Card, Voter ID, or Passport), (2) Current Address Proof, and (3) One passport-size photograph. No income proof or CIBIL score is mandated.',
    },
    {
      q: 'How is the purity and value of my gold jewellery assessed?',
      a: 'Our certified valuer uses calibrated non-destructive electronic purity testers right before your eyes. Gold ornaments are weighed precisely, stones and non-gold weight are deducted, and the loan is computed based on today’s 24K benchmark rate (₹7,000/g).',
    },
    {
      q: 'What is the maximum loan amount I can receive?',
      a: 'As per Reserve Bank of India (RBI) guidelines, you can receive up to 75% of your gold’s net market valuation (Loan-to-Value). Loans start from ₹10,000 up to ₹25,00,000.',
    },
    {
      q: 'Is my gold safe and insured with TGlobal?',
      a: 'Absolutely. Your jewellery is sealed in tamper-proof bags in your presence and deposited in secure Grade-IV bank vaults with 100% comprehensive insurance coverage at zero extra cost to you.',
    },
    {
      q: 'How does doorstep valuation work?',
      a: 'Once your online application is submitted, our certified valuation agent visits your home or office at your scheduled convenience with a portable gold testing kit. Upon approval, loan proceeds are disbursed directly to your bank account within 30 minutes.',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-bold text-[#08432a] bg-[#d8f2e4] px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-block mb-3">
          Customer Support & Guide
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-[#0f1914] tracking-tight">
          How Can We Help You?
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#4a5b52]">
          Everything you need to know about our instant gold loan process, KYC requirements, and vault security.
        </p>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#eef8f2] text-[#08432a] flex items-center justify-center mb-4">
            <FileCheck className="w-6 h-6 stroke-[2]" />
          </div>
          <h3 className="font-bold text-lg text-[#0f1914]">Minimal KYC</h3>
          <p className="mt-2 text-xs sm:text-sm text-[#55695e] leading-relaxed">
            Only Aadhaar & PAN required. Zero income documents or credit score checks needed.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#eef8f2] text-[#08432a] flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 stroke-[2]" />
          </div>
          <h3 className="font-bold text-lg text-[#0f1914]">30-Minute Disbursal</h3>
          <p className="mt-2 text-xs sm:text-sm text-[#55695e] leading-relaxed">
            From jewelry valuation to money transferred directly to your bank account in 30 minutes.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#eef8f2] text-[#08432a] flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 stroke-[2]" />
          </div>
          <h3 className="font-bold text-lg text-[#0f1914]">Bank-Grade Vaults</h3>
          <p className="mt-2 text-xs sm:text-sm text-[#55695e] leading-relaxed">
            Tamper-proof sealed bags with 100% comprehensive insurance coverage by national insurers.
          </p>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-3xl p-6 sm:p-9 border border-emerald-100 shadow-xs mb-12">
        <h2 className="text-2xl font-bold text-[#0f1914] mb-6">Frequently Asked Questions</h2>
        <div className="divide-y divide-emerald-100/70">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#0f1914] hover:text-[#08432a] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-[#08432a]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-xs sm:text-sm text-[#4a5b52] leading-relaxed pr-6 animate-in fade-in duration-200">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Support Banner */}
      <div className="bg-[#08432a] text-white rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold">Have More Questions?</h3>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            Our gold loan experts are available 7 days a week from 9 AM to 8 PM.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/apply/chat')}
            className="bg-white text-[#08432a] hover:bg-emerald-50 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm cursor-pointer"
          >
            Chat with AI Agent
          </button>
        </div>
      </div>
    </div>
  );
};
