import React from 'react';

interface Props {
  currentBalance: number;
  accountName: string;
}

export const RunningBalance: React.FC<Props> = ({ currentBalance, accountName }) => {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm mb-4 flex justify-between items-center">
      <div>
        <p className="text-xs text-[#64748B]">{accountName}</p>
        <p className="text-xs text-[#64748B]">Current Balance</p>
      </div>
      <p className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>₹{currentBalance.toFixed(2)}</p>
    </div>
  );
};
