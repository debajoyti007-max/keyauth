import React from 'react';
import { KeyRound, ShieldCheck, Hourglass, CalendarX, RefreshCw } from 'lucide-react';
import type { DashboardStats } from '../types';

interface KpiCardsProps {
  stats: DashboardStats;
  onFilterClick?: (status: string) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ stats, onFilterClick }) => {
  const cards = [
    {
      title: 'TOTAL KEYS',
      value: stats.total_keys,
      icon: KeyRound,
      iconBg: 'bg-blue-50 text-blue-500',
      borderColor: 'hover:border-blue-300',
      filter: 'all'
    },
    {
      title: 'ACTIVE',
      value: stats.active_keys,
      icon: ShieldCheck,
      iconBg: 'bg-emerald-50 text-emerald-500',
      borderColor: 'hover:border-emerald-300',
      filter: 'active'
    },
    {
      title: 'UNUSED',
      value: stats.unused_keys,
      icon: Hourglass,
      iconBg: 'bg-amber-50 text-amber-500',
      borderColor: 'hover:border-amber-300',
      filter: 'unused'
    },
    {
      title: 'EXPIRED',
      value: stats.expired_keys,
      icon: CalendarX,
      iconBg: 'bg-rose-50 text-rose-500',
      borderColor: 'hover:border-rose-300',
      filter: 'expired'
    },
    {
      title: 'RESET',
      value: stats.reset_count,
      icon: RefreshCw,
      iconBg: 'bg-cyan-50 text-cyan-500',
      borderColor: 'hover:border-cyan-300',
      filter: 'reset'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            onClick={() => onFilterClick && onFilterClick(card.filter)}
            className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer ${card.borderColor} group flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                {card.title}
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
