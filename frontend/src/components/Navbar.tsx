import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export type TabType = 'Home' | 'Apply' | 'Loan Schemes' | 'Help';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const tabs = [
    { label: 'Home', path: '/' },
    { label: 'Apply', path: '/apply' },
    { label: 'Loan Schemes', path: '/loan-schemes' },
    { label: 'Help', path: '/help' },
  ];

  const handleTabClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isTabActive = (tabPath: string) => {
    if (tabPath === '/') return location.pathname === '/';
    return location.pathname.startsWith(tabPath);
  };

  return (
    <header className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-6 pb-4">
      <div className="flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => handleTabClick('/')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          {/* Stylized monogram logo icon */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg 
              viewBox="0 0 36 36" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-8 h-8 text-[#08432a] transition-transform duration-300 group-hover:scale-105"
            >
              <circle 
                cx="18" 
                cy="18" 
                r="12" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeDasharray="56 18" 
              />
              <path 
                d="M13 10.5C11 5.5 16 3.5 19.5 5.5C19.5 9.5 17 11.5 13 10.5Z" 
                fill="currentColor" 
              />
            </svg>
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-[#0a2318] group-hover:text-[#08432a] transition-colors">
            tglobal
          </span>
        </div>

        {/* Desktop Navigation Tabs (Center) */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-11">
          {tabs.map((tab) => {
            const active = isTabActive(tab.path);
            return (
              <button
                key={tab.path}
                type="button"
                onClick={() => handleTabClick(tab.path)}
                className={`relative text-[15px] transition-all duration-200 py-1.5 font-medium cursor-pointer ${
                  active
                    ? 'text-[#08432a] font-bold'
                    : 'text-[#44564c] hover:text-[#08432a]'
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#08432a] rounded-full animate-in fade-in" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Apply CTA Button & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleTabClick('/apply')}
            className="hidden sm:inline-flex items-center justify-center bg-[#08432a] hover:bg-[#053220] active:scale-95 text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            Apply Now
          </button>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#08432a] hover:bg-[#e4f5ec] transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-emerald-100 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          <nav className="flex flex-col gap-2">
            {tabs.map((tab) => {
              const active = isTabActive(tab.path);
              return (
                <button
                  key={tab.path}
                  type="button"
                  onClick={() => handleTabClick(tab.path)}
                  className={`text-left px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                    active
                      ? 'bg-[#d8f2e4] text-[#08432a] font-bold'
                      : 'text-[#3f5247] hover:bg-[#f1faf5]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}

            <div className="pt-3 border-t border-emerald-100/70 mt-1">
              <button
                type="button"
                onClick={() => handleTabClick('/apply')}
                className="w-full bg-[#08432a] hover:bg-[#053220] text-white font-semibold py-3 rounded-xl shadow-sm text-center transition-all cursor-pointer"
              >
                Apply Now
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
