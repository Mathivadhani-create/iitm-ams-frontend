import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  badgeType = 'neutral',
}) => {
  let badgeColor = 'bg-gray-100 text-gray-700';
  if (badgeType === 'success') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (badgeType === 'warning') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
  if (badgeType === 'info') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs hover:border-gray-300 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</span>
        <div className="p-2 rounded-lg bg-red-50 text-[#800000]">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {badgeText && (
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeColor}`}>
            {badgeText}
          </span>
        )}
      </div>
      {subtext && <p className="mt-2 text-xs text-gray-500">{subtext}</p>}
    </div>
  );
};
