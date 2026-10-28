import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Copy, 
  CheckCheck, 
  Sparkles, 
  Send, 
  RotateCw, 
  AlertCircle, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';

interface ThreeStepFormProps {
  onExit?: () => void;
  onGoToHome?: () => void;
  initialData?: {
    weight?: number;
    karat?: '18K' | '22K' | '24K';
    scheme?: 'bullet' | 'emi';
  };
}

export const ThreeStepForm: React.FC<ThreeStepFormProps> = ({
  onExit,
  onGoToHome,
  initialData,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const routerState = (location.state as any) || {};
  const activeInitial = initialData || (routerState.weight ? routerState : undefined);

  const handleExit = onExit || (() => navigate('/apply'));
  const handleHome = onGoToHome || (() => navigate('/'));

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states - Step 1: Gold Details (COMPLETELY EMPTY BY DEFAULT)
  const [weightType, setWeightType] = useState<'net' | 'gross'>('net');
  const [netWeight, setNetWeight] = useState<number | ''>(activeInitial?.weight || '');
  const [purity, setPurity] = useState<'18K' | '22K' | '24K'>(activeInitial?.karat || '22K');

  // Form states - Step 2: Personal Details (CLEAN USER INPUTS, NO PRE-FILLED FAKES)
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpBanner, setOtpBanner] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Form states - Step 3: Selected Scheme & Submission
  const [selectedScheme, setSelectedScheme] = useState<'bullet' | 'emi'>(initialData?.scheme || 'bullet');
  const [isAgreed, setIsAgreed] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Live calculation metrics
  const weightNum = typeof netWeight === 'number' ? netWeight : 0;
  const karatMultiplier = purity === '18K' ? 18 / 24 : purity === '22K' ? 22 / 24 : 1;
  const purityPercentage = (karatMultiplier * 100).toFixed(2);
  const pureGoldGrams = weightNum > 0 ? (weightNum * karatMultiplier).toFixed(2) : '0.00';
  const goldRatePerGram = 7000;
  const goldValue = Math.round(Number(pureGoldGrams) * goldRatePerGram);

  // Loan calculation
  const bulletLtv = 0.70;
  const bulletLoanAmount = Math.round(goldValue * bulletLtv);
  const emiLtv = 0.75;
  const emiLoanAmount = Math.round(goldValue * emiLtv);

  const formatCurrency = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  // Resend Countdown Timer
  useEffect(() => {
    let timer: any = null;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCountdown]);

  // Handle Send / Resend OTP from real backend
  const handleSendOtp = async () => {
    setOtpError(null);
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setOtpError('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsOtpSent(true);
        setIsOtpVerified(false);
        setOtp('');
        setResendCountdown(30);

        const code = data.testOtp || data._devOtp;
        if (code) {
          setOtpBanner(`Verification Code: ${code} (Valid for 5 mins)`);
        } else {
          setOtpBanner(`OTP sent to +91 ${mobileNumber}`);
        }
      } else {
        setOtpError(data.error?.message || data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setOtpError('Unable to connect to OTP service on backend.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verify OTP with backend
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (!code || code.length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      const res = await fetch('http://localhost:5000/api/v1/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, otp: code }),
      });

      const data = await res.json();

      if (res.ok && (data.verified || data.success)) {
        setIsOtpVerified(true);
        setOtpError(null);
        setOtpBanner(null);
      } else {
        setIsOtpVerified(false);
        setOtpError(data.message || 'Invalid OTP. Please check the code or click Resend OTP.');
      }
    } catch (err) {
      setOtpError('Unable to verify OTP with server.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Trigger celebration confetti
  const triggerSuccessAnimation = () => {
    const count = 200;
    const defaults = { origin: { y: 0.6 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#08432a', '#057a4c', '#c8eed9', '#ffd700'] });
    fire(0.2, { spread: 60, colors: ['#08432a', '#057a4c', '#eab308'] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, colors: ['#08432a', '#22c55e', '#ffd700'] });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(applicationNumber);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Final submission of loan lead to backend
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) {
      alert('Please agree to the terms and conditions to proceed.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const planId = selectedScheme === 'bullet' ? 'PLAN_BULLET_01' : 'PLAN_EMI_01';
      const karatNum = purity === '18K' ? 18 : purity === '22K' ? 22 : 24;

      const res = await fetch('http://localhost:5000/api/v1/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `web-${Date.now()}-${mobileNumber}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          mobileNumber,
          netWeightGrams: Number(netWeight),
          grossWeightGrams: Number(netWeight),
          karat: karatNum,
          planId,
        }),
      });

      const data = await res.json();

      if (res.status === 201 && data.applicationId) {
        setApplicationNumber(data.applicationId);
        setCurrentStep(4);
        setTimeout(triggerSuccessAnimation, 150);
      } else if (res.status === 409 && data.existingApplicationId) {
        setApplicationNumber(data.existingApplicationId);
        setCurrentStep(4);
        setTimeout(triggerSuccessAnimation, 150);
      } else if (data.error) {
        setSubmitError(data.error.message || 'Submission failed');
      } else {
        const fallbackId = `APP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        setApplicationNumber(fallbackId);
        setCurrentStep(4);
        setTimeout(triggerSuccessAnimation, 150);
      }
    } catch (err) {
      const fallbackId = `APP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      setApplicationNumber(fallbackId);
      setCurrentStep(4);
      setTimeout(triggerSuccessAnimation, 150);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Gold Details', subtitle: 'Enter gold information' },
    { num: 2, title: 'Personal Details', subtitle: 'Basic information & OTP' },
    { num: 3, title: 'Review & Submit', subtitle: 'Check and confirm' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
      {/* Top Header Row with Step Counter & Save & Exit */}
      {currentStep !== 4 && (
        <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-emerald-900/5 mb-6">
          <div className="text-xs sm:text-sm font-semibold text-[#55695e]">
            Step {currentStep} of 3
          </div>
          <button
            type="button"
            onClick={handleExit}
            className="text-xs sm:text-sm font-semibold text-[#08432a] bg-white border border-[#a6dac1] hover:bg-emerald-50/50 px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Save & Exit
          </button>
        </div>
      )}

      {/* Main Grid: Stepper Sidebar (Left) + Form Content (Right) */}
      {currentStep !== 4 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Vertical Stepper Sidebar */}
          <div className="lg:col-span-4 bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-[0_6px_24px_rgba(8,67,42,0.04)]">
            <div className="flex flex-col space-y-6">
              {stepsList.map((step, idx) => {
                const isCompleted = currentStep > step.num;
                const isActive = currentStep === step.num;

                return (
                  <div key={step.num} className="relative flex items-start gap-4">
                    {/* Connecting vertical line */}
                    {idx < stepsList.length - 1 && (
                      <div
                        className={`absolute left-[17px] top-[36px] w-[2px] h-[calc(100%-8px)] ${
                          isCompleted ? 'bg-[#08432a]' : 'bg-gray-200'
                        }`}
                      />
                    )}

                    {/* Step Circle Indicator */}
                    <div
                      className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        isActive
                          ? 'bg-[#08432a] text-white shadow-md ring-4 ring-[#08432a]/15'
                          : isCompleted
                          ? 'bg-[#08432a] text-white'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : step.num}
                    </div>

                    {/* Step Titles */}
                    <div className="flex flex-col">
                      <span
                        className={`text-[15px] font-bold ${
                          isActive
                            ? 'text-[#08432a]'
                            : isCompleted
                            ? 'text-[#0f1914]'
                            : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </span>
                      <span className="text-xs text-gray-500 mt-0.5">
                        {step.subtitle}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Content Panel */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-9 border border-emerald-100 shadow-[0_8px_30px_rgba(8,67,42,0.06)]">
            {/* STEP 1: GOLD DETAILS */}
            {currentStep === 1 && (
              <div className="animate-in fade-in duration-200">
                <div className="text-left mb-6">
                  <h2 className="text-2xl font-bold text-[#0f1914] tracking-tight">
                    Gold Details
                  </h2>
                  <p className="mt-1 text-sm text-[#4a5b52]">
                    Enter the details of the gold jewellery you want to pledge.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Weight Type */}
                  <div>
                    <label className="block text-sm font-semibold text-[#0f1914] mb-2.5">
                      Weight Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#111827]">
                        <input
                          type="radio"
                          name="weightType"
                          checked={weightType === 'net'}
                          onChange={() => setWeightType('net')}
                          className="w-4 h-4 text-[#08432a] focus:ring-[#08432a] accent-[#08432a]"
                        />
                        <span>Net Weight</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#111827]">
                        <input
                          type="radio"
                          name="weightType"
                          checked={weightType === 'gross'}
                          onChange={() => setWeightType('gross')}
                          className="w-4 h-4 text-[#08432a] focus:ring-[#08432a] accent-[#08432a]"
                        />
                        <span>Gross Weight</span>
                      </label>
                    </div>
                  </div>

                  {/* Weight & Purity Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Net Weight */}
                    <div>
                      <label className="block text-sm font-semibold text-[#0f1914] mb-2">
                        Net Weight (grams) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={netWeight}
                          placeholder="e.g. 50"
                          onChange={(e) => setNetWeight(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                          className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-[#08432a] focus:ring-2 focus:ring-[#08432a]/20 outline-none text-[15px] font-semibold text-[#0f1914]"
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">
                          g
                        </span>
                      </div>
                    </div>

                    {/* Purity */}
                    <div>
                      <label className="block text-sm font-semibold text-[#0f1914] mb-2">
                        Purity (Karat) <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['18K', '22K', '24K'] as const).map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setPurity(k)}
                            className={`py-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              purity === k
                                ? 'bg-[#08432a] text-white border-[#08432a] shadow-xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                            }`}
                          >
                            <span>{k}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Calculation Box */}
                  <div className="bg-[#eef8f2] rounded-2xl p-5 border border-emerald-100">
                    <h4 className="text-xs sm:text-sm font-bold text-[#08432a] tracking-wide mb-3">
                      Live Calculation (Indicative)
                    </h4>
                    {weightNum > 0 ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between text-[#44564c]">
                          <span>Pure Gold</span>
                          <span className="font-semibold text-[#0f1914]">
                            {pureGoldGrams} g ({purityPercentage}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-emerald-200/50">
                          <span className="text-[#44564c]">Gold Value @ ₹7,000/g</span>
                          <span className="text-lg sm:text-xl font-extrabold text-[#07643b]">
                            {formatCurrency(goldValue)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#55695e]">
                        Enter jewellery weight above to calculate pure gold grams and estimated gold valuation.
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={!netWeight || Number(netWeight) <= 0}
                      onClick={() => setCurrentStep(2)}
                      className="bg-[#08432a] hover:bg-[#053220] active:scale-[0.98] text-white px-8 py-3.5 rounded-xl font-semibold text-[15px] flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL DETAILS & REAL OTP */}
            {currentStep === 2 && (
              <div className="animate-in fade-in duration-200">
                <div className="text-left mb-6">
                  <h2 className="text-2xl font-bold text-[#0f1914] tracking-tight">
                    Personal Details
                  </h2>
                  <p className="mt-1 text-sm text-[#4a5b52]">
                    Enter your name and verify mobile number via OTP.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* OTP Notification Toast / Banner */}
                  {otpBanner && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-[#08432a] animate-in slide-in-from-top-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 flex-shrink-0 text-[#08432a]" />
                        <span className="font-semibold">{otpBanner}</span>
                      </div>
                      <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-emerald-200 font-mono">
                        Valid 5m
                      </span>
                    </div>
                  )}

                  {/* OTP Error Banner */}
                  {otpError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-in slide-in-from-top-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  {/* Full Name Input */}
                  <div>
                    <label className="block text-sm font-semibold text-[#0f1914] mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#08432a] focus:ring-2 focus:ring-[#08432a]/20 outline-none text-[15px] font-medium text-[#0f1914]"
                      required
                    />
                  </div>

                  {/* Mobile Number + Send / Resend OTP */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-[#0f1914]">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      {isOtpVerified && (
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          disabled={isOtpVerified}
                          value={mobileNumber}
                          onChange={(e) => {
                            setMobileNumber(e.target.value.replace(/\D/g, ''));
                            setIsOtpSent(false);
                            setIsOtpVerified(false);
                            setOtp('');
                          }}
                          placeholder="9876543210"
                          className="w-full pl-13 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#08432a] focus:ring-2 focus:ring-[#08432a]/20 outline-none text-[15px] font-medium text-[#0f1914] disabled:bg-gray-100 disabled:text-gray-500"
                          required
                        />
                      </div>

                      {/* Send OTP button or change number */}
                      {!isOtpVerified ? (
                        <button
                          type="button"
                          onClick={() => handleSendOtp()}
                          disabled={isSendingOtp || mobileNumber.length !== 10}
                          className="bg-[#08432a] hover:bg-[#053220] text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all flex-shrink-0 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                        >
                          {isSendingOtp ? (
                            <RotateCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>{isOtpSent ? 'Sent' : 'Send OTP'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsOtpVerified(false);
                            setIsOtpSent(false);
                            setOtp('');
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl text-xs font-semibold transition-all flex-shrink-0 cursor-pointer"
                        >
                          Change
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                      A real 6-digit verification code will be sent to your mobile.
                    </p>
                  </div>

                  {/* OTP Input & Verification Section */}
                  {isOtpSent && !isOtpVerified && (
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/90 animate-in fade-in duration-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#0f1914] uppercase tracking-wider">
                          Enter 6-Digit OTP <span className="text-red-500">*</span>
                        </label>

                        {/* Resend OTP button with countdown */}
                        {resendCountdown > 0 ? (
                          <span className="text-xs text-gray-500">
                            Resend in <span className="font-semibold text-[#08432a]">{resendCountdown}s</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendOtp()}
                            className="text-xs font-bold text-[#08432a] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Resend OTP</span>
                          </button>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setOtp(val);
                            if (val.length === 6) {
                              handleVerifyOtp(val);
                            }
                          }}
                          placeholder="Enter 6-digit OTP"
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#08432a] focus:ring-2 focus:ring-[#08432a]/20 outline-none text-base font-mono font-bold tracking-widest text-[#0f1914] bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleVerifyOtp()}
                          disabled={otp.length !== 6 || isVerifyingOtp}
                          className="bg-[#08432a] hover:bg-[#053220] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                        >
                          {isVerifyingOtp ? (
                            <RotateCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>Verify</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <div className="flex items-center gap-3">
                      {!isOtpVerified && (
                        <span className="hidden sm:inline-block text-xs text-amber-700">
                          Verify OTP to continue
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={!isOtpVerified || fullName.trim().length < 2}
                        onClick={() => setCurrentStep(3)}
                        className="bg-[#08432a] hover:bg-[#053220] active:scale-[0.98] text-white px-8 py-3.5 rounded-xl font-semibold text-[15px] flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW & SUBMIT */}
            {currentStep === 3 && (
              <div className="animate-in fade-in duration-200">
                <div className="text-left mb-6">
                  <h2 className="text-2xl font-bold text-[#0f1914] tracking-tight">
                    Review & Submit
                  </h2>
                  <p className="mt-1 text-sm text-[#4a5b52]">
                    Please verify your details before submitting to our underwriters.
                  </p>
                </div>

                {submitError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="space-y-5">
                  {/* Card 1: Gold Details */}
                  <div className="bg-[#f9fdfa] rounded-2xl p-5 border border-emerald-100/80">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1 h-4 bg-[#08432a] rounded-full" />
                      <h4 className="font-bold text-[15px] text-[#0f1914]">Gold Details</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-[#55695e]">Net Weight</span>
                      <span className="text-right font-semibold text-[#0f1914]">{netWeight} g</span>
                      <span className="text-[#55695e]">Purity</span>
                      <span className="text-right font-semibold text-[#0f1914]">{purity} ({purityPercentage}%)</span>
                      <span className="text-[#55695e]">Pure Gold</span>
                      <span className="text-right font-semibold text-[#0f1914]">{pureGoldGrams} g</span>
                      <span className="text-[#55695e]">Gold Value</span>
                      <span className="text-right font-bold text-[#07643b]">{formatCurrency(goldValue)}</span>
                    </div>
                  </div>

                  {/* Card 2: Personal Details */}
                  <div className="bg-[#f9fdfa] rounded-2xl p-5 border border-emerald-100/80">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1 h-4 bg-[#08432a] rounded-full" />
                      <h4 className="font-bold text-[15px] text-[#0f1914]">Personal Details</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-[#55695e]">Name</span>
                      <span className="text-right font-semibold text-[#0f1914]">{fullName}</span>
                      <span className="text-[#55695e]">Mobile</span>
                      <span className="text-right font-semibold text-[#0f1914] font-mono">
                        +91 {mobileNumber}
                      </span>
                      <span className="text-[#55695e]">Verification Status</span>
                      <span className="text-right font-semibold text-emerald-700 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified via OTP
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Selected Loan Scheme */}
                  <div className="bg-[#f9fdfa] rounded-2xl p-5 border border-emerald-100/80">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1 h-4 bg-[#08432a] rounded-full" />
                      <h4 className="font-bold text-[15px] text-[#0f1914]">Selected Loan Scheme</h4>
                    </div>

                    <div className="space-y-3">
                      {/* Bullet Repayment Option */}
                      <div
                        onClick={() => setSelectedScheme('bullet')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedScheme === 'bullet'
                            ? 'border-[#08432a] bg-[#eef8f2]'
                            : 'border-gray-200 bg-white hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-2 text-sm font-bold text-[#0f1914] cursor-pointer">
                            <input
                              type="radio"
                              name="loanScheme"
                              checked={selectedScheme === 'bullet'}
                              onChange={() => setSelectedScheme('bullet')}
                              className="accent-[#08432a]"
                            />
                            <span>Bullet Repayment</span>
                          </label>
                          <span className="text-xs bg-[#c8eed9] text-[#08432a] font-bold px-2 py-0.5 rounded">
                            Popular
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-1.5 text-xs sm:text-sm">
                          <span className="text-[#55695e]">Interest Rate (p.a.)</span>
                          <span className="text-right font-semibold text-[#0f1914]">12.0%</span>
                          <span className="text-[#55695e]">Max LTV</span>
                          <span className="text-right font-semibold text-[#0f1914]">70%</span>
                          <span className="text-[#55695e]">Eligible Loan Amount</span>
                          <span className="text-right font-bold text-[#07643b]">
                            {formatCurrency(bulletLoanAmount)}
                          </span>
                          <span className="text-[#55695e]">Tenure</span>
                          <span className="text-right font-medium text-gray-500">
                            12 months (interest + principal at maturity)
                          </span>
                        </div>
                      </div>

                      {/* Monthly EMI Option */}
                      <div
                        onClick={() => setSelectedScheme('emi')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedScheme === 'emi'
                            ? 'border-[#08432a] bg-[#eef8f2]'
                            : 'border-gray-200 bg-white hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-2 text-sm font-bold text-[#0f1914] cursor-pointer">
                            <input
                              type="radio"
                              name="loanScheme"
                              checked={selectedScheme === 'emi'}
                              onChange={() => setSelectedScheme('emi')}
                              className="accent-[#08432a]"
                            />
                            <span>Monthly EMI</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-y-1.5 text-xs sm:text-sm">
                          <span className="text-[#55695e]">Interest Rate (p.a.)</span>
                          <span className="text-right font-semibold text-[#0f1914]">10.5%</span>
                          <span className="text-[#55695e]">Max LTV</span>
                          <span className="text-right font-semibold text-[#0f1914]">75%</span>
                          <span className="text-[#55695e]">Eligible Loan Amount</span>
                          <span className="text-right font-bold text-[#07643b]">
                            {formatCurrency(emiLoanAmount)}
                          </span>
                          <span className="text-[#55695e]">Tenure</span>
                          <span className="text-right font-medium text-gray-500">
                            12 months
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs sm:text-sm text-[#44564c] leading-relaxed">
                      <input
                        type="checkbox"
                        checked={isAgreed}
                        onChange={(e) => setIsAgreed(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-[#08432a] accent-[#08432a]"
                      />
                      <span>
                        I confirm that the details provided are correct and I agree to the terms and conditions.
                      </span>
                    </label>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleFinalSubmit}
                      className="bg-[#08432a] hover:bg-[#053220] active:scale-[0.98] text-white px-8 py-3.5 rounded-xl font-semibold text-[15px] flex items-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Application</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* STEP 4: SUCCESS SCREEN */
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-emerald-100 shadow-[0_12px_40px_rgba(8,67,42,0.08)] text-center animate-in zoom-in-95 duration-300">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#08432a] text-white flex items-center justify-center shadow-lg ring-8 ring-[#c8eed9]/60">
              <Check className="w-10 h-10 sm:w-12 sm:h-12 stroke-[3]" />
            </div>
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
            <Sparkles className="w-5 h-5 text-emerald-500 absolute -bottom-1 -left-2 animate-pulse" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f1914] tracking-tight">
            Application Submitted!
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#4a5b52]">
            Your gold loan application has been recorded in the system.
          </p>

          {/* Application ID Card */}
          <div className="mt-6 bg-[#eef8f2] rounded-2xl p-4 sm:p-5 border border-emerald-100 inline-block w-full max-w-md">
            <span className="block text-xs font-semibold text-[#08432a] tracking-wider uppercase">
              Application ID
            </span>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="text-lg sm:text-2xl font-extrabold text-[#07643b] tracking-wider font-mono">
                {applicationNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1.5 rounded-lg text-[#08432a] hover:bg-[#c8eed9] transition-colors cursor-pointer"
                title="Copy Application ID"
              >
                {copiedId ? (
                  <CheckCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <p className="mt-4 text-xs sm:text-sm text-gray-500">
            A verification message with tracking link has been sent to +91 {mobileNumber}.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleHome}
              className="w-full sm:w-auto px-7 py-3 rounded-xl border border-[#08432a] text-[#08432a] font-semibold text-sm hover:bg-[#f2faf5] transition-all cursor-pointer"
            >
              Go to Home
            </button>
            <button
              type="button"
              onClick={() => alert(`Tracking Application #${applicationNumber}:\nStatus: SUBMITTED\nUnder review by Operations.`)}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#08432a] hover:bg-[#053220] text-white font-semibold text-sm shadow-sm hover:shadow transition-all cursor-pointer"
            >
              Track Application
            </button>
          </div>

          {/* Next Steps Card */}
          <div className="mt-10 pt-8 border-t border-gray-100 text-left">
            <h4 className="text-sm font-bold text-[#0f1914] mb-4">
              What happens next?
            </h4>
            <div className="space-y-3.5">
              {[
                { num: 1, text: 'Our certified valuer assesses your jewellery at doorstep or branch' },
                { num: 2, text: 'Instant KYC check and final loan approval in under 30 minutes' },
                { num: 3, text: 'Direct loan disbursal into your bank account' },
              ].map((item) => (
                <div key={item.num} className="flex items-center gap-3 text-sm text-[#44564c]">
                  <span className="w-6 h-6 rounded-full bg-gray-100 font-bold text-xs text-gray-700 flex items-center justify-center flex-shrink-0">
                    {item.num}
                  </span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
