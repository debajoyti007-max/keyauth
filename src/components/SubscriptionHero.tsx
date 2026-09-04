import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SubscriptionHero: React.FC = () => {
  const { user } = useAuth();

  // Live ticking countdown
  const [timeLeft, setTimeLeft] = useState({
    days: 19,
    hours: 15,
    minutes: 48,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden transition-all">
      {/* Decorative ambient background blur lights */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Content */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner shrink-0">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-100/80">
                ACCOUNT STATUS
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white mb-1">
              Subscription Validity
            </h2>
            <p className="text-sm text-blue-100/90 font-normal">
              {user?.role === 'owner' 
                ? 'Master Owner License • Unlimited Free Fire authorization & renewals.' 
                : 'Manage your keys, customer devices and renewals before expiration.'}
            </p>
          </div>
        </div>

        {/* Right Time Remaining Display */}
        <div className="text-left md:text-right bg-black/15 md:bg-transparent p-4 md:p-0 rounded-2xl border md:border-0 border-white/10">
          <div className="text-[11px] uppercase tracking-widest font-bold text-blue-200/80 mb-1">
            TIME REMAINING
          </div>
          <div className="text-3xl md:text-4xl font-extrabold tracking-tight font-mono text-white flex items-baseline gap-1">
            <span>{timeLeft.days}d</span>
            <span className="opacity-90">{timeLeft.hours}h</span>
            <span className="opacity-90">{timeLeft.minutes}m</span>
            <span className="text-blue-200">{timeLeft.seconds}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
