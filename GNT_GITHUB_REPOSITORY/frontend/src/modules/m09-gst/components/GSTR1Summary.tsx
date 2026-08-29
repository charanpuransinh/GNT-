import React from 'react';
import { GSTReturnDTO } from '../services/gst.types';

interface Props {
  data: GSTReturnDTO[];
}

export const GSTR1Summary: React.FC<Props> = ({ data }) => {
  const totalTaxable = data.reduce((s, r) => s + r.taxable_value, 0);
  const totalTax = data.reduce((s, r) => s + r.tax_amount, 0);
  const totalInvoices = data.reduce((s, r) => s + r.invoice_count, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
          <p className="text-xs text-[#64748B]">Total Invoices</p>
          <p className="text-2xl font-bold text-[#0F172A]">{totalInvoices}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
          <p className="text-xs text-[#64748B]">Taxable Value</p>
          <p className="text-2xl font-bold text-[#2563EB]">₹{totalTaxable.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
          <p className="text-xs text-[#64748B]">Tax Amount</p>
          <p className="text-2xl font-bold text-[#16A34A]">₹{totalTax.toFixed(2)}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC]">
            <tr>
              <th className="px-4 py-3 text-left text-[#64748B] font-medium">Section</th>
              <th className="px-4 py-3 text-right text-[#64748B] font-medium">Invoices</th>
              <th className="px-4 py-3 text-right text-[#64748B] font-medium">Taxable Value</th>
              <th className="px-4 py-3 text-right text-[#64748B] font-medium">Tax Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t border-[#E2E8F0]">
                <td className="px-4 py-3 font-medium text-[#0F172A] uppercase">{row.section}</td>
                <td className="px-4 py-3 text-right">{row.invoice_count}</td>
                <td className="px-4 py-3 text-right">₹{row.taxable_value.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">₹{row.tax_amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
