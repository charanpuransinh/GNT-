import React from 'react';

interface Props {
  data: {
    taxable_amount: number;
    cgst_amount: number;
    sgst_amount: number;
    igst_amount: number;
    cess_amount: number;
    total_tax_amount: number;
  };
  isInterState: boolean;
}

export const GSTBreakupPanel: React.FC<Props> = ({ data, isInterState }) => {
  const rows = isInterState
    ? [
        { label: 'IGST', amount: data.igst_amount, color: 'bg-[#2563EB]' },
        { label: 'CESS', amount: data.cess_amount, color: 'bg-[#F59E0B]' },
      ]
    : [
        { label: 'CGST', amount: data.cgst_amount, color: 'bg-[#2563EB]' },
        { label: 'SGST', amount: data.sgst_amount, color: 'bg-[#0EA5E9]' },
        { label: 'CESS', amount: data.cess_amount, color: 'bg-[#F59E0B]' },
      ];

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Tax Breakup</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-[#F8FAFC] rounded-lg">
          <p className="text-xs text-[#64748B]">Taxable Amount</p>
          <p className="text-xl font-bold text-[#0F172A]">₹{data.taxable_amount.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-[#F8FAFC] rounded-lg">
          <p className="text-xs text-[#64748B]">Total Tax</p>
          <p className="text-xl font-bold text-[#16A34A]">₹{data.total_tax_amount.toFixed(2)}</p>
        </div>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${row.color}`} />
            <span className="text-sm text-[#64748B] w-16">{row.label}</span>
            <div className="flex-1 h-2 bg-[#F8FAFC] rounded-full overflow-hidden">
              <div className={`h-full ${row.color} rounded-full`} style={{ width: `${data.total_tax_amount > 0 ? (row.amount / data.total_tax_amount) * 100 : 0}%` }} />
            </div>
            <span className="text-sm font-medium text-[#0F172A] w-20 text-right">₹{row.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex justify-between">
        <span className="text-sm font-medium text-[#0F172A]">Grand Total</span>
        <span className="text-lg font-bold text-[#0F172A]">₹{(data.taxable_amount + data.total_tax_amount).toFixed(2)}</span>
      </div>
    </div>
  );
};
