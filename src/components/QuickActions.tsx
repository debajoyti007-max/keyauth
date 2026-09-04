import React from 'react';
import { Zap, Plus, ListFilter, Users, Settings, Shield, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface QuickActionsProps {
  onOpenGenerate: () => void;
  onNavigateKeys: () => void;
  onNavigateUsers: () => void;
  onOpenSettings: () => void;
  onOpenBalance: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onOpenGenerate,
  onNavigateKeys,
  onNavigateUsers,
  onOpenSettings,
  onOpenBalance,
}) => {
  const { user } = useAuth();

  const formattedBalance = user?.balance !== undefined 
    ? new Intl.NumberFormat('en-IN').format(user.balance) 
    : '0';

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-600 fill-blue-500/20" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Quick Actions</h3>
        </div>

        {/* 4 Action Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
          <button
            onClick={onOpenGenerate}
            className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border border-slate-200/90 hover:border-blue-500/40 hover:bg-blue-50/40 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
              Generate
            </span>
          </button>

          <button
            onClick={onNavigateKeys}
            className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border border-slate-200/90 hover:border-blue-500/40 hover:bg-blue-50/40 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
              <ListFilter className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
              All Keys
            </span>
          </button>

          <button
            onClick={onNavigateUsers}
            className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border border-slate-200/90 hover:border-blue-500/40 hover:bg-blue-50/40 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
              Users
            </span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border border-slate-200/90 hover:border-blue-500/40 hover:bg-blue-50/40 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
              Settings
            </span>
          </button>
        </div>
      </div>

      {/* Role Level & Balance Footer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Role Level */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ROLE LEVEL
            </div>
            <div className="text-base font-bold text-slate-800 capitalize">
              {user?.role || 'Owner'}
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div 
          onClick={onOpenBalance}
          className="bg-emerald-50/70 hover:bg-emerald-100/60 border border-emerald-200/70 rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-wider">
              BALANCE
            </div>
            <div className="text-base font-extrabold text-emerald-600">
              ₹{formattedBalance}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
