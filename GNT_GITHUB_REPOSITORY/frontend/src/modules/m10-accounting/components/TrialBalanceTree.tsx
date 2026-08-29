import React from 'react';
import { TrialBalanceDTO } from '../services/accounting.types';

interface Props {
  data: TrialBalanceDTO[];
}

export const TrialBalanceTree: React.FC<Props> = ({ data }) => {
  const grouped = data.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, TrialBalanceDTO[]>);

  const totalDebit = data.reduce((s, i) => s + i.debit, 0);
  const totalCredit = data.reduce((s, i) => s + i.credit, 0);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#F8FAFC]">
          <tr>
            <th className="px-4 py-3 text-left text-[#64748B] font-medium">Account</th>
            <th className="px-4 py-3 text-left text-[#64748B] font-medium">Type</th>
            <th className="px-4 py-3 text-right text-[#64748B] font-medium">Debit</th>
            <th className="px-4 py-3 text-right text-[#64748B] font-medium">Credit</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([type, items]) => (
            <React.Fragment key={type}>
              <tr className="bg-gray-50">
                <td colSpan={4} className="px-4 py-2 font-semibold text-[#0F172A] uppercase text-xs tracking-wide">{type}</td>
              </tr>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-[#E2E8F0]">
                  <td className="px-4 py-2 text-[#0F172A]">{item.name}</td>
                  <td className="px-4 py-2 text-[#64748B] text-xs capitalize">{item.type}</td>
                  <td className="px-4 py-2 text-right">{item.debit > 0 ? `₹${item.debit.toFixed(2)}` : '-'}</td>
                  <td className="px-4 py-2 text-right">{item.credit > 0 ? `₹${item.credit.toFixed(2)}` : '-'}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
          <tr className="bg-[#F8FAFC] font-semibold border-t-2 border-[#E2E8F0]">
            <td colSpan={2} className="px-4 py-3 text-[#0F172A]">TOTAL</td>
            <td className="px-4 py-3 text-right text-[#0F172A]">₹{totalDebit.toFixed(2)}</td>
            <td className="px-4 py-3 text-right text-[#0F172A]">₹{totalCredit.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      {Math.abs(totalDebit - totalCredit) < 0.01 ? (
        <div className="px-4 py-2 bg-green-50 text-[#16A34A] text-xs text-center">✓ Trial Balance is balanced</div>
      ) : (
        <div className="px-4 py-2 bg-red-50 text-[#DC2626] text-xs text-center">✗ Difference: ₹{Math.abs(totalDebit - totalCredit).toFixed(2)}</div>
      )}
    </div>
  );
};
