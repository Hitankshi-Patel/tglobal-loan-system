import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface AiAssistantChatProps {
  onProceedToForm?: (data: { weight: number; karat: '18K' | '22K' | '24K'; scheme: 'bullet' | 'emi' }) => void;
  onExit?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  time: string;
  text?: string;
  provider?: string;
  toolsUsed?: string[];
  goldData?: {
    weight: number;
    karat: '18K' | '22K' | '24K';
    pureGold: number;
    goldValue: number;
  };
  showSchemes?: boolean;
}

export const AiAssistantChat: React.FC<AiAssistantChatProps> = ({
  onProceedToForm,
  onExit,
}) => {
  const navigate = useNavigate();
  const [selectedScheme, setSelectedScheme] = useState<'bullet' | 'emi'>('bullet');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial state: Completely empty except for single welcome greeting (NO fake user messages or prefilled calculations!)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      time: 'Just now',
      text: "👋 Welcome to TGlobal Financial Services! I am your AI Gold Loan Specialist. How can I help you today? You can ask me anything about gold valuations, loan schemes, or check how much loan you can get for your jewellery.",
    },
  ]);

  const quickPrompts = [
    { label: '💰 Check loan for 40g 22K gold', prompt: 'I have 40 grams of 22K gold jewellery. What loan amount can I get?' },
    { label: '📊 Compare Bullet vs EMI schemes', prompt: 'Can you compare the Bullet repayment scheme and Monthly EMI scheme?' },
    { label: '📄 What documents are needed?', prompt: 'What documents and KYC proofs are required to get a gold loan?' },
    { label: '⚡ How fast is doorstep loan disbursal?', prompt: 'How does doorstep valuation work and how fast is the loan disbursed?' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = (customText || inputText).trim();
    if (!text || isTyping) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      time: currentTime,
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Build conversation history payload for backend agent
      const history = [...messages, userMsg].map((m) => ({
        role: m.sender === 'ai' ? ('assistant' as const) : ('user' as const),
        content: m.text || '',
      }));

      const res = await fetch('http://localhost:5000/api/v1/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();
      const replyText = data.reply || "I'm here to assist with your gold loan calculation and application.";
      const toolsUsed: string[] = data.toolsUsed || [];
      const provider: string = data.provider || 'AI Engine';

      // Parse gold weight & karat if calculation or quote requested
      let goldData: ChatMessage['goldData'] = undefined;
      let showSchemes = false;

      // Extract details if mentioned in conversation
      const match = text.match(/(\d+(\.\d+)?)\s*(grams?|g)?/i);
      const karatMatch = text.match(/(18|22|24)\s*k(arat)?/i);
      const weightVal = match ? parseFloat(match[1]) : 0;
      const karatVal = karatMatch ? (`${karatMatch[1]}K` as '18K' | '22K' | '24K') : '22K';

      if (weightVal > 0 || toolsUsed.includes('calculate_quote')) {
        const effectiveWeight = weightVal > 0 ? weightVal : 50;
        const multiplier = karatVal === '18K' ? 18 / 24 : karatVal === '22K' ? 22 / 24 : 1;
        const pureGold = parseFloat((effectiveWeight * multiplier).toFixed(2));
        const goldValue = Math.round(pureGold * 7000);

        goldData = {
          weight: effectiveWeight,
          karat: karatVal,
          pureGold,
          goldValue,
        };
        showSchemes = true;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: replyText,
        provider,
        toolsUsed,
        goldData,
        showSchemes,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: "I am unable to reach the AI server at http://localhost:5000. Please verify your backend server is running.",
        provider: 'offline',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        time: 'Just now',
        text: "Conversation cleared. How can I assist you with your gold loan today?",
      },
    ]);
  };

  const handleApplyWithQuote = (goldData: { weight: number; karat: '18K' | '22K' | '24K' }) => {
    if (onProceedToForm) {
      onProceedToForm({
        weight: goldData.weight,
        karat: goldData.karat,
        scheme: selectedScheme,
      });
    } else {
      navigate('/apply/form', {
        state: {
          weight: goldData.weight,
          karat: goldData.karat,
          scheme: selectedScheme,
        },
      });
    }
  };

  const handleExitChat = () => {
    if (onExit) {
      onExit();
    } else {
      navigate('/apply');
    }
  };

  const formatCurrency = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-in fade-in duration-300">
      {/* Modern Card Container */}
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-[0_12px_45px_rgba(8,67,42,0.07)] overflow-hidden flex flex-col h-[700px]">
        {/* Chat Header */}
        <div className="p-4 sm:p-5 bg-[#f4faf6] border-b border-emerald-100/80 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={handleExitChat}
              className="p-2 rounded-xl text-gray-500 hover:text-[#08432a] hover:bg-emerald-100/50 transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-[#08432a] text-white flex items-center justify-center shadow-xs">
                <Bot className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-[#0f1914] leading-tight">
                  TGlobal Loan Assistant
                </h3>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                  AI Agent
                </span>
              </div>
              <p className="text-xs text-[#55695e] mt-0.5 flex items-center gap-1.5">
                <span>RBI-Compliant Valuation • Dual Engine (Gemini / Ollama)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearChat}
              className="p-2 rounded-xl text-gray-400 hover:text-[#08432a] hover:bg-emerald-50 transition-colors cursor-pointer"
              title="Clear conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#fbfdfc]">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              {msg.sender === 'ai' ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#d4f3e3] text-[#08432a] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>

                  <div className="flex-1 space-y-3">
                    {msg.text && (
                      <div className="bg-white border border-emerald-100 text-[#0f1914] text-sm sm:text-[15px] p-4 sm:p-5 rounded-2xl rounded-tl-none max-w-2xl shadow-xs leading-relaxed whitespace-pre-wrap text-left">
                        {msg.text}
                      </div>
                    )}

                    {/* Interactive Calculation & Loan Offer Card (appears only when user requests quote) */}
                    {msg.goldData && (
                      <div className="max-w-2xl bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm text-left space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#08432a]" />
                            <h4 className="font-bold text-sm text-[#0f1914]">
                              Gold Valuation for {msg.goldData.weight}g ({msg.goldData.karat})
                            </h4>
                          </div>
                          <span className="text-xs font-semibold text-[#07643b] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            Rate: ₹7,000/g
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-2 text-xs sm:text-sm">
                          <span className="text-[#55695e]">Pure Gold Content:</span>
                          <span className="text-right font-bold text-[#0f1914]">
                            {msg.goldData.pureGold} grams
                          </span>
                          <span className="text-[#55695e]">Total Gold Market Value:</span>
                          <span className="text-right font-black text-[#07643b]">
                            {formatCurrency(msg.goldData.goldValue)}
                          </span>
                        </div>

                        {/* Scheme Options */}
                        <div className="pt-2">
                          <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                            Select Loan Plan:
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Bullet Repayment */}
                            <div
                              onClick={() => setSelectedScheme('bullet')}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${selectedScheme === 'bullet'
                                  ? 'border-[#08432a] bg-[#eef8f2] shadow-xs ring-1 ring-[#08432a]'
                                  : 'border-gray-200 bg-white hover:border-emerald-300'
                                }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs sm:text-sm text-[#0f1914]">
                                  Bullet Repayment
                                </span>
                                <span className="text-[10px] font-bold text-[#08432a] bg-[#c8eed9] px-1.5 py-0.5 rounded">
                                  70% LTV
                                </span>
                              </div>
                              <div className="text-xs text-[#55695e]">
                                <span>12.0% p.a. • 12 mos</span>
                                <div className="text-base font-extrabold text-[#07643b] mt-1">
                                  {formatCurrency(msg.goldData.goldValue * 0.70)}
                                </div>
                              </div>
                            </div>

                            {/* Monthly EMI */}
                            <div
                              onClick={() => setSelectedScheme('emi')}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${selectedScheme === 'emi'
                                  ? 'border-[#08432a] bg-[#eef8f2] shadow-xs ring-1 ring-[#08432a]'
                                  : 'border-gray-200 bg-white hover:border-emerald-300'
                                }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs sm:text-sm text-[#0f1914]">
                                  Monthly EMI
                                </span>
                                <span className="text-[10px] font-bold text-[#08432a] bg-[#c8eed9] px-1.5 py-0.5 rounded">
                                  75% LTV
                                </span>
                              </div>
                              <div className="text-xs text-[#55695e]">
                                <span>10.5% p.a. • 12 mos</span>
                                <div className="text-base font-extrabold text-[#07643b] mt-1">
                                  {formatCurrency(msg.goldData.goldValue * 0.75)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApplyWithQuote(msg.goldData!)}
                            className="w-full mt-3.5 bg-[#08432a] hover:bg-[#053220] active:scale-[0.98] text-white font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm transition-all cursor-pointer"
                          >
                            <span>Proceed to Application with this Quote</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span>{msg.time}</span>
                      {msg.provider && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {msg.provider}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* User Message */
                <div className="flex flex-col items-end">
                  <div className="bg-[#08432a] text-white text-sm sm:text-[15px] p-3.5 px-5 rounded-2xl rounded-tr-none max-w-xl shadow-xs leading-relaxed text-right font-medium">
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1">{msg.time}</span>
                </div>
              )}
            </div>
          ))}

          {/* Initial Suggestion Chips (only when conversation just started) */}
          {messages.length === 1 && (
            <div className="pt-2 animate-in fade-in duration-300">
              <span className="block text-xs font-bold text-[#55695e] mb-2.5 text-left">
                Suggested questions:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {quickPrompts.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(undefined, item.prompt)}
                    className="p-3 bg-white hover:bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs sm:text-[13px] font-medium text-[#0f1914] hover:text-[#08432a] transition-all text-left shadow-2xs hover:shadow-xs flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#d4f3e3] text-[#08432a] flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-emerald-100 p-3.5 px-4 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-[#08432a] shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-[#08432a]" />
                <span>AI Assistant is calculating loan offers...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => handleSendMessage(e)}
          className="p-3 sm:p-4 bg-white border-t border-emerald-100/80 flex items-center gap-2.5"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your question (e.g. 'How much loan can I get for 50g 22K gold?')"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#08432a] focus:ring-2 focus:ring-[#08432a]/15 outline-none text-sm text-[#0f1914] bg-[#fdfefe]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="h-11 px-5 bg-[#08432a] hover:bg-[#053220] active:scale-95 text-white rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5 font-semibold text-sm"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
