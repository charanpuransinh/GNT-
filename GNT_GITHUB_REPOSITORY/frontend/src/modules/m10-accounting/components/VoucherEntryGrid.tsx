import React from 'react';
import { AccountDTO } from '../services/accounting.types';

interface VoucherItem {
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  narration?: string;
}

interface Props {
  accounts: AccountDTO[];
  items: VoucherItem[];
  onChange: (items: VoucherItem[]) => void;
}

export const VoucherEntryGrid: React.FC<Props> = ({ accounts, items, onChange }) => {
  const updateItem = (idx: number, field: keyof VoucherItem, value: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onChange(newItems);
  };

  const addRow = () => onChange([...items, { account_id: '', debit_amount: 0, credit_amount: 0, narration: '' }]);
  const removeRow = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-4">
            <select className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={item.account_id} onChange={(e) => updateItem(idx, 'account_id', e.target.value)}>
              <option value="">Select Account</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <input type="number" placeholder="Debit" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={item.debit_amount || ''} onChange={(e) => updateItem(idx, 'debit_amount', Number(e.target.value))} />
          </div>
          <div className="col-span-2">
            <input type="number" placeholder="Credit" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={item.credit_amount || ''} onChange={(e) => updateItem(idx, 'credit_amount', Number(e.target.value))} />
          </div>
          <div className="col-span-3">
            <input placeholder="Narration" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={item.narration || ''} onChange={(e) => updateItem(idx, 'narration', e.target.value)} />
          </div>
          <button onClick={() => removeRow(idx)} className="col-span-1 text-[#DC2626] text-sm hover:bg-red-50 rounded py-2">✕</button>
        </div>
      ))}
      <button onClick={addRow} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#64748B] hover:bg-gray-50">+ Add Row</button>
    </div>
  );
};
