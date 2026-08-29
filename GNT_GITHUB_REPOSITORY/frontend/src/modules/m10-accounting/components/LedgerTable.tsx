import React from 'react';
import { LedgerEntryDTO } from '../services/accounting.types';

interface Props {
  entries: Array<LedgerEntryDTO & { balance?: number }>;
  accountName: string;
  openingBalance: number;
}

export const LedgerTable: React.FC<Props> = ({ entries, accountName, openingBalance }) => {
  let runningBalance = Number(openingBalance);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <h3 className="font-semibold text-[#0F172A]">{accountName}</h3>
        <p className="text-xs text-[#64748B]">Opening Balance: ₹{openingBalance.toFixed(2)}</p>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-[#F8FAFC]">
          <tr>
            <th className="px-4 py-2 text-left text-[#64748B] font-medium">Date</th>
            <th className="px-4 py-2 text-left text-[#64748B] font-medium">Particulars</th>
            <th className="px-4 py-2 text-right text-[#64748B] font-medium">Debit</th>
            <th className="px-4 py-2 text-right text-[#64748B] font-medium">Credit</th>
            <th className="px-4 py-2 text-right text-[#64748B] font-medium">Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            runningBalance += entry.debit_amount - entry.credit_amount;
            return (
              <tr key={entry.id || i} className="border-t border-[#E2E8F0]">
                <td className="px-4 py-2 text-[#64748B]">{new Date(entry.transaction_date).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-[#0F172A]">{entry.narration || '-'}</td>
                <td className="px-4 py-2 text-right text-[#0F172A]">{entry.debit_amount > 0 ? `₹${entry.debit_amount.toFixed(2)}` : '-'}</td>
                <td className="px-4 py-2 text-right text-[#0F172A]">{entry.credit_amount > 0 ? `₹${entry.credit_amount.toFixed(2)}` : '-'}</td>
                <td className="px-4 py-2 text-right font-medium text-[#2563EB]">₹{runningBalance.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
