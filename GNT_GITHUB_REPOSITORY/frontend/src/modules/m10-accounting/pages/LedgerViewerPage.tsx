import React, { useEffect, useState } from 'react';
import { useAccountingStore } from '../state/accounting.store';
import { AccountingActions } from '../state/accounting.actions';
import { LedgerTable } from '../components/LedgerTable';
import { AccountSelector } from '../components/AccountSelector';

const LedgerViewerPage: React.FC<{ companyId: string }> = ({ companyId }) => {
  const { accounts, ledgers, selectedAccount, loading } = useAccountingStore();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    AccountingActions.fetchAccounts(companyId);
  }, [companyId]);

  const handleView = () => {
    if (selectedAccount) {
      AccountingActions.fetchLedger(selectedAccount.id, fromDate || undefined, toDate || undefined);
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Ledger Viewer</h1>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm mb-6">
        <div className="grid grid-cols-4 gap-4 items-end">
          <div className="col-span-1">
            <AccountSelector
              accounts={accounts}
              selected={selectedAccount}
              onSelect={(acc) => useAccountingStore.getState().setSelectedAccount(acc)}
            />
          </div>
          <div>
            <label className="block text-xs text-[#64748B] mb-1">From Date</label>
            <input type="date" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-[#64748B] mb-1">To Date</label>
            <input type="date" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <button onClick={handleView} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700">View Ledger</button>
        </div>
      </div>
      {loading && <div className="text-center py-8 text-[#64748B]">Loading ledger...</div>}
      {selectedAccount && ledgers.length > 0 && (
        <LedgerTable entries={ledgers} accountName={selectedAccount.name} openingBalance={selectedAccount.opening_balance} />
      )}
    </div>
  );
};

export default LedgerViewerPage;
