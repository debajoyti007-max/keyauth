import React from 'react';
import { Shield, Smartphone, Users, ChevronRight } from 'lucide-react';
import type { DashboardStats } from '../types';

interface RoleCardsProps {
  stats: DashboardStats;
  onNavigateToUsers: () => void;
}

export const RoleCards: React.FC<RoleCardsProps> = ({ stats, onNavigateToUsers }) => {
  const cards = [
    {
      title: 'ADMINS',
      count: stats.admins_count,
      subtitle: 'Level 2 accounts',
      icon: Shield,
      color: 'from-blue-600 to-indigo-600',
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'RESELLERS',
      count: stats.resellers_count,
      subtitle: 'Level 3 accounts',
      icon: Smartphone,
      color: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'TOTAL USERS',
      count: stats.total_users_count,
      subtitle: 'All registered',
      icon: Users,
      color: 'from-purple-600 to-violet-600',
      iconBg: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={onNavigateToUsers}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                  {card.title}
                </span>
                <div className="text-2xl font-black text-slate-900 leading-tight">
                  {card.count}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {card.subtitle}
                </div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
