import React from 'react';
import { Search, Wallet, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenBalance: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenBalance,
  onOpenSettings
}) => {
  const { user } = useAuth();

  const formattedBalance = user?.balance !== undefined 
    ? new Intl.NumberFormat('en-IN').format(user.balance) 
    : '0';

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Search Bar */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search keys, HWID, users..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Wallet Balance Pill */}
        <button
          onClick={onOpenBalance}
          title="Click to manage balance"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 text-sm font-bold tracking-tight transition-all shadow-xs"
        >
          <Wallet className="w-4 h-4 text-blue-600" />
          <span>₹{formattedBalance}</span>
        </button>

        {/* Notification Bell */}
        <button 
          title="Notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </button>

        {/* Profile Dropdown */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs uppercase">
            {user?.username ? user.username.charAt(0) : 'M'}
          </div>
          <span className="text-sm font-semibold text-slate-800 capitalize">
            {user?.username || 'Owner'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </header>
  );
};
