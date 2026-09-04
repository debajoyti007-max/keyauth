import React, { useState } from 'react';
import { 
  KeyRound, 
  Copy, 
  Check, 
  Pause, 
  Play, 
  RefreshCw, 
  Ban, 
  Trash2, 
  Download, 
  Search, 
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { LicenseKey } from '../types';

interface LicenseKeysTableProps {
  keys: LicenseKey[];
  onRefresh: () => void;
  onOpenGenerate: () => void;
  initialFilter?: string;
}

export const LicenseKeysTable: React.FC<LicenseKeysTableProps> = ({
  keys,
  onRefresh,
  onOpenGenerate,
  initialFilter = 'all'
}) => {
  const { token, user } = useAuth();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>(initialFilter);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const copyKey = (keyString: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKey(keyString);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handlePause = async (userKey: string) => {
    setActionLoading(userKey);
    try {
      const res = await fetch(`/api/keys/${userKey}/pause`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to pause key');
      showNotification(`Key ${userKey.substring(0, 10)}... has been paused (Time Frozen)`);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (userKey: string) => {
    setActionLoading(userKey);
    try {
      const res = await fetch(`/api/keys/${userKey}/resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resume key');
      showNotification(`Key ${userKey.substring(0, 10)}... resumed with preserved time!`);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetHWID = async (userKey: string) => {
    setActionLoading(userKey);
    try {
      const res = await fetch(`/api/keys/${userKey}/reset-hwid`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset HWID');
      showNotification(`Device HWID reset for ${userKey.substring(0, 10)}...`);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBan = async (userKey: string) => {
    setActionLoading(userKey);
    try {
      const res = await fetch(`/api/keys/${userKey}/ban`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle ban');
      showNotification(`Key ${userKey.substring(0, 10)}... ban status updated`);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userKey: string) => {
    if (!window.confirm(`Delete key ${userKey}? This cannot be undone.`)) return;
    setActionLoading(userKey);
    try {
      const res = await fetch(`/api/keys/${userKey}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete key');
      showNotification(`Key deleted`);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkReset = async () => {
    if (!window.confirm('Are you sure you want to reset ALL device bindings for Free Fire?')) return;
    try {
      const res = await fetch('/api/keys/bulk-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ game: 'FreeFire' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk reset failed');
      showNotification(`Successfully reset ${data.count} Free Fire devices!`);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const downloadAllKeys = () => {
    const lines = filteredKeys.map(k => `${k.user_key} | Game: ${k.game} | Duration: ${k.duration} | Status: ${k.status}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MONTAGE_KEYS_EXPORT_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter keys
  const filteredKeys = keys.filter(k => {
    const matchesSearch = k.user_key.toLowerCase().includes(search.toLowerCase()) ||
      (k.hwid && k.hwid.toLowerCase().includes(search.toLowerCase())) ||
      (k.created_by && k.created_by.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'reset') return (k.reset_count || 0) > 0;
    return k.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        );
      case 'unused':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Unused
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-300">
            <Pause className="w-2.5 h-2.5 fill-blue-600" />
            Time Frozen
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Expired
          </span>
        );
      case 'banned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Banned
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
      {/* Toast Notification */}
      {msg && (
        <div className={`p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold transition-all shadow-sm ${
          msg.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search & Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keys, HWID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            {['all', 'active', 'unused', 'paused', 'expired', 'banned', 'reset'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                  filterStatus === st 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          {user?.role === 'owner' && (
            <button
              onClick={handleBulkReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset All HWIDs</span>
            </button>
          )}

          <button
            onClick={downloadAllKeys}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .txt</span>
          </button>

          <button
            onClick={onOpenGenerate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-blue-500/20 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>+ Generate Keys</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">License Key</th>
              <th className="py-3.5 px-4">Game / Plan</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">HWID Binding</th>
              <th className="py-3.5 px-4">Expiration / Remaining</th>
              <th className="py-3.5 px-4">Reseller</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredKeys.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                  No license keys match your criteria
                </td>
              </tr>
            ) : (
              filteredKeys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Key string & copy */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{k.user_key}</span>
                      <button
                        onClick={() => copyKey(k.user_key)}
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Copy Key"
                      >
                        {copiedKey === k.user_key ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Game & duration */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{k.game || 'FreeFire'}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      {k.duration} • {k.max_devices || 1} Device(s)
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {getStatusBadge(k.status)}
                  </td>

                  {/* HWID */}
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {k.hwid ? (
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate max-w-[120px]" title={k.hwid}>
                          {k.hwid.substring(0, 10)}...
                        </span>
                        {k.reset_count > 0 && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                            #{k.reset_count}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not Bound</span>
                    )}
                  </td>

                  {/* Expiration */}
                  <td className="py-3 px-4">
                    {k.status === 'paused' ? (
                      <div className="text-blue-600 font-bold">
                        Paused ({Math.floor((k.remaining_seconds_on_pause || 0) / 3600)}h preserved)
                      </div>
                    ) : k.expires_at ? (
                      <div>
                        <div className="text-slate-800 font-semibold">
                          {new Date(k.expires_at).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(k.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Timer starts on first use</span>
                    )}
                  </td>

                  {/* Created By */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-700 capitalize">
                      {k.created_by}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* PAUSE / RESUME (Time Freeze) */}
                      {k.status === 'active' && (
                        <button
                          onClick={() => handlePause(k.user_key)}
                          disabled={actionLoading === k.user_key}
                          title="Pause Key (Freeze Subscription Time)"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {k.status === 'paused' && (
                        <button
                          onClick={() => handleResume(k.user_key)}
                          disabled={actionLoading === k.user_key}
                          title="Resume Key (Restore Preserved Time)"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* RESET HWID */}
                      <button
                        onClick={() => handleResetHWID(k.user_key)}
                        disabled={actionLoading === k.user_key}
                        title="Reset HWID / Device Binding"
                        className="p-1.5 rounded-lg text-cyan-600 hover:bg-cyan-50 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      {/* BAN / UNBAN */}
                      <button
                        onClick={() => handleToggleBan(k.user_key)}
                        disabled={actionLoading === k.user_key}
                        title={k.status === 'banned' ? 'Unban Key' : 'Ban Key'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          k.status === 'banned' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() => handleDelete(k.user_key)}
                        disabled={actionLoading === k.user_key}
                        title="Delete Key"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
