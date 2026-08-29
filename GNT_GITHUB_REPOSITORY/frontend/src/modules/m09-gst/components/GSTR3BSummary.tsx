import React, { useEffect, useState } from 'react';
import { GSTService } from '../services/gst.service';
import { GSTR3BDTO } from '../services/gst.types';

interface Props {
  companyId: string;
  period: string;
}

export const GSTR3BSummary: React.FC<Props> = ({ companyId, period }) => {
  const [data, setData] = useState<GSTR3BDTO | null>(null);

  useEffect(() => {
    if (period) {
      GSTService.getGSTR3B(companyId, period).then(setData);
    }
  }, [companyId, period]);

  if (!data) return <div className="text-center py-8 text-[#64748B]">Loading GSTR-3B...</div>;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#0F172A] mb-4">GSTR-3B Summary</h3>
      <div className="space-y-4">
        <div className="flex justify-between p-3 bg-[#F8FAFC] rounded-lg">
          <span className="text-[#64748B]">Total Income</span>
          <span className="font-medium text-[#16A34A]">₹{data.outward_taxable_supplies.toFixed(2)}</span>
        </div>
        <div className="flex justify-between p-3 bg-[#F8FAFC] rounded-lg">
          <span className="text-[#64748B]">Total Expense</span>
          <span className="font-medium text-[#DC2626]">₹{data.inward_taxable_supplies.toFixed(2)}</span>
        </div>
        <div className={`p-4 rounded-lg ${data.tax_payable > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className={`text-xs ${data.tax_payable > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>Tax Payable / Refund</p>
          <p className={`text-lg font-bold ${data.tax_payable > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>₹{Math.abs(data.tax_payable).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};
