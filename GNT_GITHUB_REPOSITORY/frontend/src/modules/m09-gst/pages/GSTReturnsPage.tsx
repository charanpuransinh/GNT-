import React, { useState } from 'react';
import { useGSTStore } from '../state/gst.store';
import { GSTActions } from '../state/gst.actions';
import { GSTR1Summary } from '../components/GSTR1Summary';
import { GSTR3BSummary } from '../components/GSTR3BSummary';

const GSTReturnsPage: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [period, setPeriod] = useState('2024-04');
  const [activeTab, setActiveTab] = useState<'gstr1' | 'gstr3b'>('gstr1');
  const { returns, loading, error } = useGSTStore();

  const handleFetch = async () => {
    if (activeTab === 'gstr1') {
      await GSTActions.generateGSTR1(companyId, period);
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">GST Returns</h1>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm mb-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-xs text-[#64748B] mb-1">Period (YYYY-MM)</label>
            <input type="month" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
          <div className="flex bg-[#F8FAFC] rounded-lg p-1">
            <button onClick={() => setActiveTab('gstr1')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'gstr1' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#64748B]'}`}>GSTR-1</button>
            <button onClick={() => setActiveTab('gstr3b')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'gstr3b' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#64748B]'}`}>GSTR-3B</button>
          </div>
          <button onClick={handleFetch} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700">Compile Return</button>
        </div>
      </div>
      {loading && <div className="text-center py-8 text-[#64748B]">Compiling return data...</div>}
      {error && <div className="p-4 bg-red-50 text-[#DC2626] rounded-lg text-sm">{error}</div>}
      {activeTab === 'gstr1' && returns.length > 0 && <GSTR1Summary data={returns} />}
      {activeTab === 'gstr3b' && <GSTR3BSummary companyId={companyId} period={period} />}
    </div>
  );
};

export default GSTReturnsPage;
