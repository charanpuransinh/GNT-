import React, { useEffect, useState } from 'react';
import { AccountingService } from '../services/accounting.service';
import { ProfitLossDTO } from '../services/accounting.types';

interface Props {
  companyId: string;
  fromDate: string;
  toDate: string;
}

export const ProfitLossReport: React.FC<Props> = ({ companyId, fromDate, toDate }) => {
  const [data, setData] = useState<ProfitLossDTO | null>(null);

  useEffect(() => {
    if (fromDate && toDate) {
      AccountingService.getProfitLoss(companyId, fromDate, toDate).then(setData);
    }
  }, [companyId, fromDate, toDate]);

  if (!data) return <div className="text-center py-8 text-[#64748B]">Select date range</div>;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Profit & Loss Statement</h3>
      <div className="space-y-4">
        <div className="flex justify-between p-3 bg-[#F8FAFC] rounded-lg">
          <span className="text-[#64748B]">Total Income</span>
          <span className="font-medium text-[#16A34A]">₹{data.income.toFixed(2)}</span>
        </div>
        <div className="flex justify-between p-3 bg-[#F8FAFC] rounded-lg">
          <span className="text-[#64748B]">Total Expense</span>
          <span className="font-medium text-[#DC2626]">₹{data.expense.toFixed(2)}</span>
        </div>
        <div className="flex justify-between p-4 bg-[#0F172A] rounded-lg text-white">
          <span className="font-semibold">Net {data.net_profit >= 0 ? 'Profit' : 'Loss'}</span>
          <span className="font-bold text-xl">₹{Math.abs(data.net_profit).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
