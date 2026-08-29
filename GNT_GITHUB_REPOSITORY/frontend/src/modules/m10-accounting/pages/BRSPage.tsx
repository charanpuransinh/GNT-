import React, { useEffect, useState } from 'react';
import { useAccountingStore } from '../state/accounting.store';
import { AccountingActions } from '../state/accounting.actions';
import { BRSMatcher } from '../components/BRSMatcher';

const BRSPage: React.FC<{ companyId: string }> = ({ companyId }) => {
  const { accounts, brsData } = useAccountingStore();
  const [bankAccountId, setBankAccountId] = useState('');
  const [statementDate, setStatementDate] = useState('');
  const [statementBalance, setStatementBalance] = useState(0);

  const bankAccounts = accounts.filter((a) => a.is_bank_account);

  useEffect(() => {
    AccountingActions.fetchAccounts(companyId);
  }, [companyId]);

  const handleCreateBRS = async () => {
    await fetch('/api/v1/accounting/brs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
        bank_account_id: bankAccountId,
        statement_date: statementDate,
        statement_balance: statementBalance,
        ledger_entries: [],
      }),
    });
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Bank Reconciliation</h1>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm mb-6">
        <div className="grid grid-cols-4 gap-4 items-end">
          <select className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}>
            <option value="">Select Bank Account</option>
            {bankAccounts.map((a) => <option key={a.id} value={a.id}>{a.name} - {a.bank_account_no}</option>)}
          </select>
          <input type="date" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} />
          <input type="number" placeholder="Statement Balance" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={statementBalance || ''} onChange={(e) => setStatementBalance(Number(e.target.value))} />
          <button onClick={handleCreateBRS} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium">Start Reconciliation</button>
        </div>
      </div>
      {brsData.length > 0 && <BRSMatcher data={brsData[0]} />}
    </div>
  );
};

export default BRSPage;
