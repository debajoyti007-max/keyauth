import React, { useState, useEffect } from 'react';
import { X, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

interface AddBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddBalanceModal: React.FC<AddBalanceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { token, refreshUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('1000');
  const [action, setAction] = useState<'add' | 'deduct'>('add');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: User[] = await res.json();
        // filter for resellers and admins
        const eligible = data.filter(u => u.role !== 'owner');
        setUsers(eligible);
        if (eligible.length > 0 && !selectedUserId) {
          setSelectedUserId(eligible[0].id);
        }
      }
    } catch {
      // offline
    }
  };

  if (!isOpen) return null;

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select a reseller or user');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${selectedUserId}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          action
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update balance');

      setSuccessMsg(`Successfully ${action === 'add' ? 'added' : 'deducted'} ₹${amount}! New balance: ₹${data.balance}`);
      refreshUser();
      fetchUsers();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Manage Wallet Balance</h3>
              <p className="text-xs text-slate-400 font-medium">Recharge or adjust reseller credit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleUpdateBalance} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* User selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Select Reseller / Account
            </label>
            {users.length === 0 ? (
              <div className="text-xs text-slate-400 py-2">No eligible reseller accounts found</div>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.role.toUpperCase()}) • Current Balance: ₹{u.balance || 0}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Action toggle (Add vs Deduct) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAction('add')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                action === 'add'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              + Add Balance
            </button>
            <button
              type="button"
              onClick={() => setAction('deduct')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                action === 'deduct'
                  ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              - Deduct Balance
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Amount (₹)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex gap-2">
            {['500', '1000', '2500', '5000'].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val)}
                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                +₹{val}
              </button>
            ))}
          </div>

          {/* Current balance indicator */}
          {selectedUser && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex justify-between">
              <span>Current Account Balance:</span>
              <span className="font-bold text-slate-900">₹{selectedUser.balance || 0}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || users.length === 0}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `${action === 'add' ? 'Credit' : 'Debit'} ₹${amount}`}
          </button>
        </form>
      </div>
    </div>
  );
};
