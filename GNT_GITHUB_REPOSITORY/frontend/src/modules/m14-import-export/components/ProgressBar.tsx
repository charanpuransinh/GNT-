// M14 Frontend — ProgressBar
// Lock: LOCK_04_COMPONENT
import React from 'react';

interface Props {
  current: number;
  total: number;
  label?: string;
}

export const ProgressBar: React.FC<Props> = ({ current, total, label }) => {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{label}</span>
        <span>{current} / {total} ({pct}%)</span>
      </div>}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
