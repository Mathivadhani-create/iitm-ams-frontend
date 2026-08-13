import React from 'react';
import { GradeLetter } from '../types';

interface GradeBadgeProps {
  grade?: GradeLetter | string | null;
}

export const GradeBadge: React.FC<GradeBadgeProps> = ({ grade }) => {
  if (!grade) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        Pending / Draft
      </span>
    );
  }

  let colorClasses = 'bg-gray-100 text-gray-800 border-gray-300';

  switch (grade) {
    case 'A+':
    case 'A':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      break;
    case 'A-':
    case 'B+':
      colorClasses = 'bg-blue-50 text-blue-800 border-blue-300 font-bold';
      break;
    case 'B':
    case 'B-':
      colorClasses = 'bg-indigo-50 text-indigo-800 border-indigo-300 font-semibold';
      break;
    case 'C+':
    case 'C':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      break;
    case 'D':
      colorClasses = 'bg-orange-50 text-orange-800 border-orange-300';
      break;
    case 'F':
      colorClasses = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs border ${colorClasses}`}
    >
      Grade {grade}
    </span>
  );
};
