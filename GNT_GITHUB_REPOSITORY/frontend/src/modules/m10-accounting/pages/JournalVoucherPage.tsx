import React, { useState } from 'react';
import { useAccountingStore } from '../state/accounting.store';
import { AccountingService } from '../services/accounting.service';
import { VoucherEntryGrid } from '../components/VoucherEntryGrid';

const JournalVoucherPage: React.FC<{ companyId: string }> = ({ companyId }) => {
  const { accounts } = useAccountingStore();
  const [items, setItems] = useState([{ account_id: '', debit_amount: 0, credit_amount: 0, narration: '' }]);
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherNumber, setVoucherNumber] = useState('');
  const [narration, setNarration] = useState('');

  const totalDebit = items.reduce((s, i) => s + i.debit_amount, 0);
  const totalCredit = items.reduce((s, i) => s + i.credit_amount, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSave = async () => {
    await AccountingService.createVoucher({
      company_id: companyId,
      voucher_type: 'journal',
      voucher_number: voucherNumber,
      voucher_date: voucherDate,
      narration,
      items,
    });
    setItems([{ account_id: '', debit_amount: 0, credit_amount: 0, narration: '' }]);
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Journal Voucher</h1>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-[#64748B] mb-1">Voucher No</label>
            <input className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={voucherNumber} onChange={(e) => setVoucherNumber(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-[#64748B] mb-1">Date</label>
            <input type="date" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-[#64748B] mb-1">Narration</label>
            <input className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={narration} onChange={(e) => setNarration(e.target.value)} />
          </div>
        </div>
        <VoucherEntryGrid accounts={accounts} items={items} onChange={setItems} />
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#E2E8F0]">
          <div className="flex gap-6">
            <div className={`text-sm font-medium ${isBalanced ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>Total Debit: ₹{totalDebit.toFixed(2)}</div>
            <div className={`text-sm font-medium ${isBalanced ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>Total Credit: ₹{totalCredit.toFixed(2)}</div>
          </div>
          <button onClick={handleSave} disabled={!isBalanced || !voucherNumber} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Save Voucher</button>
        </div>
      </div>
    </div>
  );
};

export default JournalVoucherPage;
