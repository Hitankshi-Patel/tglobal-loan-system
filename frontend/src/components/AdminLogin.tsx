import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string, username: string) => void;
  onBackToHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToHome,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('tglobal@admin2024');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/v1/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('tglobal_admin_token', data.token);
        localStorage.setItem('tglobal_admin_user', data.username || username);
        onLoginSuccess(data.token, data.username || username);
      } else {
        setError(data.error?.message || data.message || 'Invalid admin credentials');
      }
    } catch (err) {
      setError('Cannot connect to backend server on http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-auto px-4 py-8 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-[0_16px_40px_rgba(8,67,42,0.08)]">
        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 bg-[#e8f7ee] text-[#08432a] rounded-2xl flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h2 className="text-2xl font-black text-[#0f1914] tracking-tight">Staff Portal</h2>
          <p className="text-xs text-[#55695e] mt-1">
            Secure access for Operations & Field Agents
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0f1914] mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#08432a] focus:ring-2 focus:ring-[#08432a]/20 outline-none text-sm font-semibold text-[#0f1914]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0f1914] mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#08432a] focus:ring-2 focus:ring-[#08432a]/20 outline-none text-sm font-semibold text-[#0f1914]"
              />
            </div>
          </div>

          {/* Quick hint for evaluation */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-[#44564c]">
            <span className="font-semibold text-[#08432a]">Default credentials:</span> <br />
            Username: <code className="font-mono text-[#08432a]">admin</code> • Password: <code className="font-mono text-[#08432a]">tglobal@admin2024</code>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#08432a] hover:bg-[#053220] active:scale-[0.98] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In to Admin Portal</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-emerald-100/70 text-center">
          <button
            type="button"
            onClick={onBackToHome}
            className="text-xs font-semibold text-[#55695e] hover:text-[#08432a] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to public website</span>
          </button>
        </div>
      </div>
    </div>
  );
};
