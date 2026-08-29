import React, { useState } from 'react';
import { GSTActions } from '../state/gst.actions';
import { GSTBreakupPanel } from '../components/GSTBreakupPanel';

const GSTCalculationPage: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [items, setItems] = useState([{ hsn_code: '', taxable_amount: 0, quantity: 1 }]);
  const [stateCode, setStateCode] = useState('');
  const [companyStateCode, setCompanyStateCode] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleCalculate = async () => {
    const res = await GSTActions.calculateTax(items, stateCode, companyStateCode, companyId);
    setResult(res);
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">GST Tax Calculator</h1>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input placeholder="Company State Code (e.g. 27)" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={companyStateCode} onChange={(e) => setCompanyStateCode(e.target.value)} maxLength={2} />
          <input placeholder="Party State Code (e.g. 08)" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={stateCode} onChange={(e) => setStateCode(e.target.value)} maxLength={2} />
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-3 mb-3">
            <input placeholder="HSN Code" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={item.hsn_code} onChange={(e) => { const n = [...items]; n[idx].hsn_code = e.target.value; setItems(n); }} />
            <input placeholder="Taxable Amount" type="number" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={item.taxable_amount || ''} onChange={(e) => { const n = [...items]; n[idx].taxable_amount = Number(e.target.value); setItems(n); }} />
            <input placeholder="Qty" type="number" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={item.quantity || ''} onChange={(e) => { const n = [...items]; n[idx].quantity = Number(e.target.value); setItems(n); }} />
          </div>
        ))}
        <div className="flex gap-3">
          <button onClick={() => setItems([...items, { hsn_code: '', taxable_amount: 0, quantity: 1 }])} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#64748B] hover:bg-gray-50">+ Add Item</button>
          <button onClick={handleCalculate} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700">Calculate Tax</button>
        </div>
      </div>
      {result && <GSTBreakupPanel data={result} isInterState={stateCode !== companyStateCode} />}
    </div>
  );
};

export default GSTCalculationPage;
