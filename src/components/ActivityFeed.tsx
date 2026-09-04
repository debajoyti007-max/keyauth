import React from 'react';
import { Clock, Radio } from 'lucide-react';
import type { ActivityLog } from '../types';

interface ActivityFeedProps {
  activities: ActivityLog[];
  onClear: () => void;
  canClear: boolean;
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, onClear, canClear }) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <h3 className="text-base font-bold text-slate-800">Activity</h3>
        </div>
        {canClear && activities.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Activity Timeline List */}
      <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-4">
        {activities.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No recent activity recorded
          </div>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="relative pl-6 pb-2 group">
              {/* Timeline dot & vertical connecting line */}
              <div className="absolute left-0 top-1 text-blue-500">
                <Radio className="w-3.5 h-3.5" />
              </div>
              <div className="absolute left-[6.5px] top-4.5 bottom-0 w-[1.5px] bg-slate-100 group-last:hidden"></div>

              {/* Activity Details */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-bold text-slate-800">
                  Ticket #{act.ticket_id}
                </span>
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                  {timeAgo(act.timestamp)}
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-600 mb-1.5">
                {act.game || 'Free Fire'}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                  {act.duration}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                  {act.devices}
                </span>
                {act.action && act.action !== 'Activity' && (
                  <span className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]" title={act.action}>
                    {act.action}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
