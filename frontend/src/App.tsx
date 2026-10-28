import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeatureBadges } from './components/FeatureBadges';
import { ApplyMethodSelection } from './components/ApplyMethodSelection';
import { ThreeStepForm } from './components/ThreeStepForm';
import { AiAssistantChat } from './components/AiAssistantChat';
import { LoanSchemesPage } from './components/LoanSchemesPage';
import { HelpPage } from './components/HelpPage';
import { AdminView } from './components/AdminView';
import { Lock } from 'lucide-react';
import './App.css';

/**
 * HomePage - Hero visual, instant application CTAs, and trust badges
 */
function HomePage() {
  return (
    <>
      <HeroSection />
      <FeatureBadges />
    </>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  // Keyboard shortcut Ctrl+Shift+A to toggle admin portal access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (location.pathname.startsWith('/admin')) {
          navigate('/');
        } else {
          navigate('/admin');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-[#f3fbf6] flex flex-col font-sans selection:bg-[#c8eed9] selection:text-[#08432a]">
      {/* Top Navigation Bar with Real URL Routing */}
      <Navbar />

      {/* Main Content Area Routed with React Router */}
      <main className="flex-1 flex flex-col justify-between">
        <Routes>
          {/* Home Route */}
          <Route path="/" element={<HomePage />} />

          {/* Apply Routes */}
          <Route path="/apply" element={<ApplyMethodSelection />} />
          <Route path="/apply/form" element={<ThreeStepForm />} />
          <Route path="/apply/chat" element={<AiAssistantChat />} />

          {/* Loan Schemes Route (Connected to Live Database) */}
          <Route path="/loan-schemes" element={<LoanSchemesPage />} />

          {/* Help & Support Route */}
          <Route path="/help" element={<HelpPage />} />

          {/* Admin & Operations Staff Portal (JWT Protected) */}
          <Route path="/admin" element={<AdminView />} />

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Subtle, Professional Footer with discreet Staff Portal Access */}
      {!isAdminPath && (
        <footer className="w-full border-t border-emerald-900/5 py-6 px-6 text-center text-xs text-[#55695e]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 TGlobal Financial Technologies. All rights reserved. RBI Regulated NBFC Partner.</p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-gray-400">Doorstep & Branch Disbursal</span>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="text-gray-500 hover:text-[#08432a] transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Internal operations portal (Ctrl+Shift+A)"
              >
                <Lock className="w-3 h-3 text-gray-400" />
                <span>Staff Portal</span>
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
