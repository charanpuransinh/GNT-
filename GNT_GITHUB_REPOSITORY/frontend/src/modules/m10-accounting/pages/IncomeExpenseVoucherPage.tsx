import React, { useState } from 'react';
import { AccountingService } from '../services/accounting.service';
import { useAccountingStore } from '../state/accounting.store';

const IncomeExpenseVoucherPage: React.FC<{ companyId: string }> = ({ companyId }) => {
  const { accounts } = useAccountingStore();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState(0);
  const [accountId, setAccountId] = useState('');
  const [cashBankId, setCashBankId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');

  const filteredAccounts = accounts.filter((a) => a.type === type);
  const cashBankAccounts = accounts.filter((a) => a.is_bank_account || a.name.toLowerCase().includes('cash'));

  const handleSave = async () => {
    const isIncome = type === 'income';
    await AccountingService.createVoucher({
      company_id: companyId,
      voucher_type: isIncome ? 'cash_receipt' : 'cash_payment',
      voucher_number: `${type.toUpperCase()}-${Date.now()}`,
      voucher_date: date,
      narration,
      items: [
        { account_id: cashBankId, debit_amount: isIncome ? amount : 0, credit_amount: isIncome ? 0 : amount },
        { account_id: accountId, debit_amount: isIncome ? 0 : amount, credit_amount: isIncome ? amount : 0 },
      ],
    });
    setAmount(0);
    setNarration('');
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Income / Expense Voucher</h1>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm max-w-2xl">
        <div className="flex gap-4 mb-6">
          <button onClick={() => setType('expense')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${type === 'expense' ? 'bg-[#DC2626] text-white' : 'bg-[#F8FAFC] text-[#64748B]'}`}>Expense</button>
          <button onClick={() => setType('income')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${type === 'income' ? 'bg-[#16A34A] text-white' : 'bg-[#F8FAFC] text-[#64748B]'}`}>Income</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#64748B] mb-1">{type === 'income' ? 'Income Account' : 'Expense Account'}</label>
            <select className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Select</option>
              {filteredAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#64748B] mb-1">Cash / Bank Account</label>
            <select className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={cashBankId} onChange={(e) => setCashBankId(e.target.value)}>
              <option value="">Select</option>
              {cashBankAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#64748B] mb-1">Amount</label>
              <input type="number" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs text-[#64748B] mb-1">Date</label>
              <input type="date" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#64748B] mb-1">Narration</label>
            <input className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={narration} onChange={(e) => setNarration(e.target.value)} />
          </div>
          <button onClick={handleSave} disabled={!accountId || !cashBankId || amount <= 0} className="w-full py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Save {type === 'income' ? 'Income' : 'Expense'}</button>
        </div>
      </div>
    </div>
  );
};

export default IncomeExpenseVoucherPage;
