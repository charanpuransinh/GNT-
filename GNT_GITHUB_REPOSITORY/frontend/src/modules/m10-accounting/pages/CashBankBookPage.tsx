import React, { useEffect, useState } from 'react';
import { useAccountingStore } from '../state/accounting.store';
import { AccountingActions } from '../state/accounting.actions';
import { AccountingService } from '../services/accounting.service';
import { LedgerTable } from '../components/LedgerTable';
import { RunningBalance } from '../components/RunningBalance';

const CashBankBookPage: React.FC<{ companyId: string }> = ({ companyId }) => {
  const { accounts, ledgers } = useAccountingStore();
  const [selectedBankId, setSelectedBankId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const bankAccounts = accounts.filter((a) => a.is_bank_account || a.name.toLowerCase().includes('cash'));

  useEffect(() => {
    AccountingActions.fetchAccounts(companyId);
  }, [companyId]);

  const handleView = async () => {
    if (selectedBankId) {
      const entries = await AccountingService.getLedger(selectedBankId, fromDate, toDate);
      useAccountingStore.getState().setLedgers(entries);
    }
  };

  const selectedAcc = accounts.find((a) => a.id === selectedBankId);

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Cash / Bank Book</h1>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm mb-6">
        <div className="grid grid-cols-4 gap-4 items-end">
          <select className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)}>
            <option value="">Select Account</option>
            {bankAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.bank_account_no || 'Cash'})</option>
            ))}
          </select>
          <input type="date" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <input type="date" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <button onClick={handleView} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium">View Register</button>
        </div>
      </div>
      {selectedAcc && (
        <RunningBalance currentBalance={selectedAcc.current_balance} accountName={selectedAcc.name} />
      )}
      {ledgers.length > 0 && (
        <LedgerTable entries={ledgers} accountName={selectedAcc?.name || ''} openingBalance={selectedAcc?.opening_balance || 0} />
      )}
    </div>
  );
};

export default CashBankBookPage;
