import React from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  KeyRound, 
  Users, 
  Wallet, 
  Trash2, 
  Ban, 
  Server, 
  Sliders, 
  Clock, 
  Lock,
  LogOut,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenGenerate: () => void;
  onOpenBalance: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenGenerate,
  onOpenBalance,
  onOpenSettings
}) => {
  const { user, logout } = useAuth();

  const navItemClass = (id: string) => {
    const isActive = activeTab === id;
    return `w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
      isActive
        ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm'
        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
    }`;
  };

  return (
    <aside className="w-64 min-w-[16rem] h-screen sticky top-0 bg-white border-r border-slate-200/80 flex flex-col justify-between select-none z-30">
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              MONTAGE
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              CONTROL PANEL
            </span>
          </div>
        </div>

        {/* User Mini Profile Card */}
        <div className="bg-slate-50/90 border border-slate-200/70 rounded-2xl p-3 mb-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs uppercase">
              {user?.username ? user.username.charAt(0) : 'M'}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800 capitalize leading-tight">
                {user?.username || 'Montage'}
              </div>
              <div className="text-[11px] text-slate-400 capitalize font-medium">
                {user?.role || 'Owner'}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {/* Nav Sections */}
        <div className="space-y-5">
          {/* DASHBOARDS */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
              Dashboards
            </div>
            <button
              onClick={() => setActiveTab('overview')}
              className={navItemClass('overview')}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-500" />
              <span>Overview</span>
            </button>
          </div>

          {/* USER SYSTEM */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
              User System
            </div>
            <div className="space-y-0.5">
              <button
                onClick={onOpenGenerate}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Generate Key</span>
              </button>
              <button
                onClick={() => setActiveTab('keys')}
                className={navItemClass('keys')}
              >
                <KeyRound className="w-4 h-4 text-blue-500" />
                <span>License Keys</span>
              </button>
              <button
                onClick={() => setActiveTab('client-reset')}
                className={navItemClass('client-reset')}
              >
                <Smartphone className="w-4 h-4 text-cyan-500" />
                <span>Client Reset Portal</span>
              </button>
            </div>
          </div>

          {/* MANAGEMENT */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
              Management
            </div>
            <div className="space-y-0.5">
              {(user?.role === 'owner' || user?.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={navItemClass('users')}
                >
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>Users</span>
                </button>
              )}
              {(user?.role === 'owner' || user?.role === 'admin') && (
                <button
                  onClick={onOpenBalance}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors"
                >
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <span>Add Balance</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('keys')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Delete Keys</span>
              </button>
              <button
                onClick={() => setActiveTab('keys')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors"
              >
                <Ban className="w-4 h-4 text-red-500" />
                <span>Ban / Unban</span>
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors"
              >
                <Server className="w-4 h-4 text-emerald-500" />
                <span>Servers Online</span>
              </button>
            </div>
          </div>

          {/* CORE CONFIG */}
          {user?.role === 'owner' && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                Core Config
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={onOpenSettings}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors"
                >
                  <Sliders className="w-4 h-4 text-slate-700" />
                  <span>Site Config (Secret Key)</span>
                </button>
                <button
                  onClick={onOpenSettings}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors"
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Durations & Pricing</span>
                </button>
                <button
                  onClick={onOpenSettings}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors"
                >
                  <Lock className="w-4 h-4 text-purple-600" />
                  <span>Permissions</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-200/80">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all border border-rose-200/60"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
