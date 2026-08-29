import React from 'react';
import { BRSDTO } from '../services/accounting.types';

interface Props {
  data: BRSDTO;
}

export const BRSMatcher: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#0F172A]">Reconciliation Status</h3>
        <span className={`px-3 py-1 rounded text-xs font-medium ${data.status === 'reconciled' ? 'bg-green-100 text-[#16A34A]' : 'bg-yellow-100 text-[#F59E0B]'}`}>{data.status.toUpperCase()}</span>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-[#F8FAFC] rounded-lg text-center">
          <p className="text-xs text-[#64748B]">Statement Balance</p>
          <p className="text-lg font-bold text-[#0F172A]">₹{data.statement_balance.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-[#F8FAFC] rounded-lg text-center">
          <p className="text-xs text-[#64748B]">Ledger Balance</p>
          <p className="text-lg font-bold text-[#0F172A]">₹{data.ledger_balance.toFixed(2)}</p>
        </div>
        <div className={`p-3 rounded-lg text-center ${Math.abs(data.difference) < 0.01 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-xs text-[#64748B]">Difference</p>
          <p className={`text-lg font-bold ${Math.abs(data.difference) < 0.01 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>₹{data.difference.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};
