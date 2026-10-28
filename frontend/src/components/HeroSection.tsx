import React from 'react';
import { ArrowRight } from 'lucide-react';
import goldJewelryImg from '../assets/gold-jewelry.jpg';

import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  onApplyClick?: () => void;
  onChatClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onApplyClick,
  onChatClick,
}) => {
  const navigate = useNavigate();
  const handleApply = onApplyClick || (() => navigate('/apply'));
  const handleChat = onChatClick || (() => navigate('/apply/chat'));
  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-4 sm:pt-8 pb-6 sm:pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        {/* Left Content Column */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center text-left z-10">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold leading-[1.12] tracking-tight text-[#0f1914]">
            Get a Gold Loan
            <span className="block text-[#07643b] mt-1 sm:mt-1.5">
              In Minutes.
            </span>
          </h1>

          {/* Subtitle / Description */}
          <p className="mt-6 text-[16px] sm:text-[18px] text-[#44564c] leading-relaxed max-w-lg font-normal">
            Quick, transparent and secure gold loan offers.
            <br className="hidden sm:inline" /> Apply online or chat with our AI assistant.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4 sm:gap-5">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleApply}
              className="group inline-flex items-center justify-center gap-2.5 bg-[#08432a] hover:bg-[#053220] active:scale-[0.98] text-white px-7 py-3.5 rounded-2xl font-semibold text-[15px] shadow-[0_4px_16px_rgba(8,67,42,0.22)] hover:shadow-[0_6px_20px_rgba(8,67,42,0.3)] transition-all duration-200 cursor-pointer"
            >
              <span>Apply for a Gold Loan</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>

            {/* Secondary Action: AI Assistant */}
            <button
              type="button"
              onClick={handleChat}
              className="inline-flex items-center justify-center gap-3 bg-white/80 hover:bg-white active:scale-[0.98] text-[#08432a] border border-[#a4dcbf] hover:border-[#08432a]/40 px-6 py-3.5 rounded-2xl font-semibold text-[15px] shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-sm cursor-pointer"
            >
              {/* Camera/Bot Visor Icon matching reference screenshot */}
              <span className="w-5 h-5 rounded-[6px] border-[2px] border-[#08432a] flex items-center justify-center p-0.5">
                <span className="w-2 h-2 rounded-full border-[1.5px] border-[#08432a]" />
              </span>
              <span>Chat with AI Assistant</span>
            </button>
          </div>
        </div>

        {/* Right Jewelry Visual Showcase */}
        <div className="lg:col-span-6 xl:col-span-6 relative flex items-center justify-center pt-2 sm:pt-0">
          <div className="relative w-full max-w-[540px]">
            {/* Organic Mint Blob Background */}
            <div 
              className="absolute inset-0 -m-3 sm:-m-6 bg-gradient-to-br from-[#c6edd7] via-[#d7f5e5] to-[#e4f8ed] opacity-95 -z-10"
              style={{
                borderRadius: '52% 48% 60% 40% / 46% 58% 42% 54%',
              }}
            />

            {/* Floating 75% Stat Badge (Top-Right) */}
            <div className="absolute top-1 sm:top-3 right-2 sm:right-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl px-5 py-4 shadow-[0_12px_32px_rgba(8,67,42,0.1)] border border-emerald-100/90 hover:scale-105 transition-transform duration-300 select-none">
              <span className="block text-[12px] font-medium text-[#486355] leading-tight">
                Loan up to
              </span>
              <span className="block text-3xl sm:text-[34px] font-extrabold text-[#07643b] tracking-tight leading-none my-1">
                75%
              </span>
              <span className="block text-[12px] font-medium text-[#486355] leading-tight">
                of gold value
              </span>
            </div>

            {/* Gold Jewelry Showcase Image with Multiply Blend */}
            <div className="relative z-10 w-full overflow-hidden rounded-3xl p-2 sm:p-4">
              <img
                src={goldJewelryImg}
                alt="Exquisite Gold Jewelry for Instant Loan"
                className="w-full h-auto object-contain drop-shadow-[0_16px_24px_rgba(7,50,30,0.1)] transition-transform duration-500 hover:scale-[1.02]"
                style={{
                  mixBlendMode: 'multiply',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
