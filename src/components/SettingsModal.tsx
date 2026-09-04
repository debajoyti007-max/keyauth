import React, { useState, useEffect } from 'react';
import { X, Sliders, KeyRound, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { token, user } = useAuth();

  const [secretKey, setSecretKey] = useState('');
  const [siteName, setSiteName] = useState('MONTAGE CORPORATION');
  const [defaultGame, setDefaultGame] = useState('FreeFire');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowClientReset, setAllowClientReset] = useState(true);
  const [cooldownHours, setCooldownHours] = useState(24);
  const [announcement, setAnnouncement] = useState('');
  const [prices, setPrices] = useState({ '1d': 20, '7d': 100, '30d': 300, 'lifetime': 800 });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.secret_key) setSecretKey(data.secret_key);
        if (data.site_name) setSiteName(data.site_name);
        if (data.default_game) setDefaultGame(data.default_game);
        setMaintenanceMode(Boolean(data.maintenance_mode));
        setAllowClientReset(Boolean(data.allow_client_self_reset));
        setCooldownHours(data.client_reset_cooldown_hours || 24);
        if (data.announcement) setAnnouncement(data.announcement);
        if (data.reseller_prices) setPrices(data.reseller_prices);
      }
    } catch {
      // offline
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'owner') {
      setError('Only the Owner can change system configuration and Secret Key.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          secret_key: secretKey,
          site_name: siteName,
          default_game: defaultGame,
          maintenance_mode: maintenanceMode,
          allow_client_self_reset: allowClientReset,
          client_reset_cooldown_hours: cooldownHours,
          announcement: announcement,
          reseller_prices: prices
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setSuccessMsg('System configuration and Secret Key saved successfully!');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Control Panel Settings</h3>
              <p className="text-xs text-slate-400 font-medium">Configure Secret Key, Free Fire guard & pricing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SECRET KEY FIELD (Highlighted as per user request) */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>C++ Client Secret Key</span>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-800">
                CRITICAL
              </span>
            </div>
            <p className="text-[11px] text-amber-700/90 leading-relaxed font-medium">
              This key signs the MD5 token for your C++ Android client. Must match the client code:
            </p>
            <input
              type="text"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="e.g. Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E"
              className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Maintenance Mode Switch */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Free Fire Safe Mode / Maintenance</div>
                <div className="text-xs text-slate-400">Block game connections during anti-cheat updates</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                maintenanceMode ? 'bg-rose-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                  maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Client Self-Reset Switch & Cooldown */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-800">Allow Player Self-Service HWID Reset</div>
                <div className="text-xs text-slate-400">Players can reset device on the public portal</div>
              </div>
              <button
                type="button"
                onClick={() => setAllowClientReset(!allowClientReset)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  allowClientReset ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                    allowClientReset ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {allowClientReset && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Reset Cooldown Period:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={cooldownHours}
                    onChange={(e) => setCooldownHours(parseInt(e.target.value) || 24)}
                    className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-800"
                  />
                  <span className="text-slate-500 font-medium">Hours</span>
                </div>
              </div>
            )}
          </div>

          {/* Reseller Pricing Configuration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Reseller Key Wallet Pricing (₹)
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { id: '1d', label: '1 Day' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'lifetime', label: 'Lifetime' }
              ].map(plan => (
                <div key={plan.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-xs font-semibold text-slate-500 mb-1">{plan.label}</div>
                  <div className="flex items-center justify-center">
                    <span className="text-xs text-slate-400 mr-0.5">₹</span>
                    <input
                      type="number"
                      value={prices[plan.id as keyof typeof prices] || 0}
                      onChange={(e) => setPrices({ ...prices, [plan.id]: parseFloat(e.target.value) || 0 })}
                      className="w-14 bg-white border border-slate-200 rounded text-center text-xs font-bold text-slate-800 py-0.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Broadcast Announcement */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              System Announcement Banner
            </label>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="e.g. MONTAGE CORPORATION V1.0 • All systems operational"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:bg-slate-300"
          >
            {loading ? 'Saving Settings...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
};
