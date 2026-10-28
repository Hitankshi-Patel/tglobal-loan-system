import React from 'react';
import { Timer, Calculator, ShieldCheck } from 'lucide-react';

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const FeatureBadges: React.FC = () => {
  const features: FeatureItem[] = [
    {
      icon: <Timer className="w-6 h-6 text-[#08432a] stroke-[2.2]" />,
      title: 'Quick & Simple',
      description: '3 step application',
    },
    {
      icon: <Calculator className="w-6 h-6 text-[#08432a] stroke-[2.2]" />,
      title: 'Exact Calculations',
      description: 'Backed by live rates',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#08432a] stroke-[2.2]" />,
      title: 'Secure & Reliable',
      description: 'Your data is safe',
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-8 sm:pt-10 pb-16">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
        {features.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 sm:gap-4.5 group p-2 rounded-2xl hover:bg-white/40 transition-colors duration-200"
          >
            {/* Mint Circle Icon Container */}
            <div className="flex-shrink-0 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#c8eed9] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-[#bce8d0] transition-all duration-300">
              {item.icon}
            </div>

            {/* Title & Description */}
            <div className="flex flex-col text-left">
              <h3 className="text-[17px] font-bold text-[#0f1914] tracking-tight leading-snug">
                {item.title}
              </h3>
              <p className="text-[14px] text-[#55695e] font-normal leading-normal mt-0.5">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
