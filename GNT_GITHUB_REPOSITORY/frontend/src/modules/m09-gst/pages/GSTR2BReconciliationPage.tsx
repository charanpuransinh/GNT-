import React, { useState } from 'react';
import { GSTService } from '../services/gst.service';

const GSTR2BReconciliationPage: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [purchaseData, setPurchaseData] = useState([{ invoice_no: '', gstin: '', tax_amount: 0 }]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleReconcile = async () => {
    setLoading(true);
    try {
      const res = await GSTService.reconcileGSTR2B(companyId, purchaseData);
      setResults(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">GSTR-2B Reconciliation</h1>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm mb-6">
        <p className="text-sm text-[#64748B] mb-4">Enter purchase invoice data to match against GSTR-2B</p>
        {purchaseData.map((row, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-3 mb-3">
            <input placeholder="Invoice No" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={row.invoice_no} onChange={(e) => { const n = [...purchaseData]; n[idx].invoice_no = e.target.value; setPurchaseData(n); }} />
            <input placeholder="Vendor GSTIN" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={row.gstin} onChange={(e) => { const n = [...purchaseData]; n[idx].gstin = e.target.value; setPurchaseData(n); }} />
            <input placeholder="Tax Amount" type="number" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={row.tax_amount || ''} onChange={(e) => { const n = [...purchaseData]; n[idx].tax_amount = Number(e.target.value); setPurchaseData(n); }} />
          </div>
        ))}
        <div className="flex gap-3">
          <button onClick={() => setPurchaseData([...purchaseData, { invoice_no: '', gstin: '', tax_amount: 0 }])} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#64748B]">+ Add Row</button>
          <button onClick={handleReconcile} className="px-6 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700">Reconcile</button>
        </div>
      </div>
      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC]">
              <tr><th className="px-4 py-3 text-left text-[#64748B] font-medium">Invoice No</th><th className="px-4 py-3 text-left text-[#64748B] font-medium">Status</th><th className="px-4 py-3 text-right text-[#64748B] font-medium">Difference</th></tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-t border-[#E2E8F0]">
                  <td className="px-4 py-3">{r.invoice_no}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${r.matched ? 'bg-green-100 text-[#16A34A]' : 'bg-red-100 text-[#DC2626]'}`}>{r.matched ? 'Matched' : 'Unmatched'}</span></td>
                  <td className="px-4 py-3 text-right">{r.difference.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GSTR2BReconciliationPage;
