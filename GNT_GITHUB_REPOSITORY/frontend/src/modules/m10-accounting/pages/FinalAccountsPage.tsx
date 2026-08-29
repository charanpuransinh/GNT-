import React, { useState } from 'react';
import { useAccountingStore } from '../state/accounting.store';
import { AccountingActions } from '../state/accounting.actions';
import { TrialBalanceTree } from '../components/TrialBalanceTree';
import { ProfitLossReport } from '../components/ProfitLossReport';
import { BalanceSheetReport } from '../components/BalanceSheetReport';

const FinalAccountsPage: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [activeTab, setActiveTab] = useState<'tb' | 'pl' | 'bs'>('tb');
  const { trialBalance, loading } = useAccountingStore();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const handleGenerate = async () => {
    if (activeTab === 'tb') {
      await AccountingActions.generateTrialBalance(companyId, asOfDate);
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">Final Accounts</h1>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex bg-[#F8FAFC] rounded-lg p-1">
            <button onClick={() => setActiveTab('tb')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'tb' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#64748B]'}`}>Trial Balance</button>
            <button onClick={() => setActiveTab('pl')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'pl' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#64748B]'}`}>Profit & Loss</button>
            <button onClick={() => setActiveTab('bs')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'bs' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#64748B]'}`}>Balance Sheet</button>
          </div>
          {activeTab === 'tb' || activeTab === 'bs' ? (
            <div>
              <label className="block text-xs text-[#64748B] mb-1">As of Date</label>
              <input type="date" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs text-[#64748B] mb-1">From</label>
                <input type="date" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-[#64748B] mb-1">To</label>
                <input type="date" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </>
          )}
          <button onClick={handleGenerate} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium">Generate</button>
        </div>
      </div>
      {loading && <div className="text-center py-8 text-[#64748B]">Generating...</div>}
      {activeTab === 'tb' && trialBalance.length > 0 && <TrialBalanceTree data={trialBalance} />}
      {activeTab === 'pl' && <ProfitLossReport companyId={companyId} fromDate={fromDate} toDate={toDate} />}
      {activeTab === 'bs' && <BalanceSheetReport companyId={companyId} asOfDate={asOfDate} />}
    </div>
  );
};

export default FinalAccountsPage;
