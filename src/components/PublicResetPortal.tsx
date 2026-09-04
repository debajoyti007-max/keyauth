import React, { useState } from 'react';
import { Smartphone, RefreshCw, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';

export const PublicResetPortal: React.FC = () => {
  const [userKey, setUserKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userKey.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/public/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_key: userKey.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset device binding');
      }

      setResult({
        success: true,
        message: data.message || 'HWID Device Binding successfully reset!'
      });
      setUserKey('');
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'An error occurred during reset'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Top Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            MONTAGE CORPORATION
          </h2>
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mt-1">
            PLAYER SELF-SERVICE DEVICE RESET
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Enter Your Free Fire License Key
            </label>
            <div className="relative">
              <Smartphone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={userKey}
                onChange={(e) => setUserKey(e.target.value)}
                placeholder="e.g. MONTAGE-FF-XXXX-XXXX"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              * Note: For anti-abuse protection, players can perform 1 reset per 24 hours.
            </p>
          </div>

          {result && (
            <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-3 animate-fade-in ${
              result.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{result.message}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-lg shadow-blue-500/25 cursor-pointer disabled:bg-slate-300 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Verifying & Resetting...' : 'Reset Device Binding'}</span>
          </button>
        </form>

        {/* Feature badges footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Safe & Instant</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Free Fire Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
