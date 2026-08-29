import React, { useEffect, useState } from 'react';
import { AccountingService } from '../services/accounting.service';
import { BalanceSheetDTO } from '../services/accounting.types';

interface Props {
  companyId: string;
  asOfDate: string;
}

export const BalanceSheetReport: React.FC<Props> = ({ companyId, asOfDate }) => {
  const [data, setData] = useState<BalanceSheetDTO | null>(null);

  useEffect(() => {
    if (asOfDate) {
      AccountingService.getBalanceSheet(companyId, asOfDate).then(setData);
    }
  }, [companyId, asOfDate]);

  if (!data) return <div className="text-center py-8 text-[#64748B]">Select date</div>;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#0F172A]">Balance Sheet</h3>
        {data.balanced ? (
          <span className="px-2 py-1 bg-green-100 text-[#16A34A] text-xs rounded">✓ Balanced</span>
        ) : (
          <span className="px-2 py-1 bg-red-100 text-[#DC2626] text-xs rounded">✗ Unbalanced</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[#64748B] uppercase tracking-wide">Assets</h4>
          <div className="p-4 bg-[#F8FAFC] rounded-lg">
            <p className="text-2xl font-bold text-[#2563EB]">₹{data.assets.toFixed(2)}</p>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[#64748B] uppercase tracking-wide">Liabilities + Equity</h4>
          <div className="p-4 bg-[#F8FAFC] rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Liabilities</span>
              <span className="font-medium">₹{data.liabilities.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Equity</span>
              <span className="font-medium">₹{data.equity.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-[#E2E8F0] flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{(data.liabilities + data.equity).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
