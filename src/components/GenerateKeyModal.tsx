import React, { useState } from 'react';
import { X, Zap, Copy, Check, Download, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { SystemSettings } from '../types';

interface GenerateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  settings?: SystemSettings | null;
}

export const GenerateKeyModal: React.FC<GenerateKeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  settings
}) => {
  const { user, token, updateUserBalance } = useAuth();

  const [game, setGame] = useState('FreeFire');
  const [duration, setDuration] = useState('7d');
  const [count, setCount] = useState(1);
  const [prefix, setPrefix] = useState('MONTAGE-FF');
  const [maxDevices, setMaxDevices] = useState(1);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const prices = settings?.reseller_prices || { '1d': 20, '7d': 100, '30d': 300, 'lifetime': 800 };
  const costPerKey = prices[duration] || 100;
  const totalCost = costPerKey * count;
  const isReseller = user?.role === 'reseller';
  const insufficientBalance = isReseller && (user?.balance || 0) < totalCost;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/keys/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          game,
          duration,
          count,
          prefix,
          max_devices: maxDevices,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate keys');
      }

      setGeneratedKeys(data.key_strings || []);
      if (isReseller && user) {
        updateUserBalance(user.balance - totalCost);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyAllKeys = () => {
    navigator.clipboard.writeText(generatedKeys.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    const blob = new Blob([generatedKeys.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MONTAGE_KEYS_${duration.toUpperCase()}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetModal = () => {
    setGeneratedKeys([]);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 fill-blue-500/20" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Generate License Keys</h3>
              <p className="text-xs text-slate-400 font-medium">Create authorized Free Fire access keys</p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {generatedKeys.length > 0 ? (
            /* Result View */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium">
                ✅ Successfully generated {generatedKeys.length} license key(s)! Keys are currently in <strong>Unused</strong> status and subscription timer will only start upon first login in Free Fire.
              </div>

              <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-2xl max-h-48 overflow-y-auto space-y-1 select-all border border-slate-800">
                {generatedKeys.map((k, i) => (
                  <div key={i} className="flex justify-between items-center py-0.5">
                    <span>{k}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={copyAllKeys}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy All Keys'}</span>
                </button>
                <button
                  type="button"
                  onClick={downloadTxt}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .txt</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setGeneratedKeys([])}
                className="w-full text-center text-xs font-semibold text-blue-600 hover:underline pt-2"
              >
                + Generate More Keys
              </button>
            </div>
          ) : (
            /* Generation Form */
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Game Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Target Game
                </label>
                <select
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="FreeFire">Free Fire (Garena)</option>
                  <option value="PUBG">PUBG Mobile / BGMI</option>
                </select>
              </div>

              {/* Duration Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Duration Plan
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: '1d', label: '1 Day', price: prices['1d'] || 20 },
                    { id: '7d', label: '7 Days', price: prices['7d'] || 100 },
                    { id: '30d', label: '30 Days', price: prices['30d'] || 300 },
                    { id: 'lifetime', label: 'Lifetime', price: prices['lifetime'] || 800 },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDuration(d.id)}
                      className={`py-2.5 px-2 rounded-xl text-center border transition-all cursor-pointer ${
                        duration === d.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600 font-medium'
                      }`}
                    >
                      <div className="text-xs">{d.label}</div>
                      {isReseller && (
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          ₹{d.price}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count & Max Devices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={count}
                    onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Device Limit
                  </label>
                  <select
                    value={maxDevices}
                    onChange={(e) => setMaxDevices(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value={1}>1 Device (Strict HWID)</option>
                    <option value={2}>2 Devices (Dual Phone)</option>
                  </select>
                </div>
              </div>

              {/* Custom Prefix */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Key Prefix
                </label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g. MONTAGE-FF"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Customer Notes / Tag (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Buyer on Telegram @player1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Reseller Cost Summary */}
              {isReseller && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Total Cost:</span>{' '}
                    <span className="font-extrabold text-blue-700 text-sm">₹{totalCost}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Your Balance:</span>{' '}
                    <span className="font-bold text-slate-800">₹{user?.balance || 0}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || Boolean(insufficientBalance)}
                className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white transition-all shadow-md ${
                  insufficientBalance
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-blue-500/20 cursor-pointer'
                }`}
              >
                {loading ? 'Generating...' : insufficientBalance ? 'Insufficient Balance' : `Generate ${count} Key(s)`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
