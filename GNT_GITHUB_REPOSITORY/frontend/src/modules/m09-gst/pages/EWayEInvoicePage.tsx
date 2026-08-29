import React, { useState } from 'react';
import { GSTActions } from '../state/gst.actions';
import { useGSTStore } from '../state/gst.store';
import { EInvoiceGenerator } from '../components/EInvoiceGenerator';

const EWayEInvoicePage: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [invoiceId, setInvoiceId] = useState('');
  const [transport, setTransport] = useState({ distance_km: 0, vehicle_no: '' });
  const { eInvoices, loading } = useGSTStore();

  const handleGenerateEInvoice = async () => {
    await GSTActions.generateEInvoice(invoiceId);
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">E-Invoice & E-Way Bill</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Generate E-Invoice</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#64748B] mb-1">Sales Invoice ID</label>
              <input className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} placeholder="Enter invoice ID" />
            </div>
            <button onClick={handleGenerateEInvoice} disabled={loading || !invoiceId} className="w-full py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Generating...' : 'Generate IRN + QR Code'}</button>
          </div>
          {eInvoices.length > 0 && (
            <div className="mt-6 space-y-3">
              {eInvoices.map((ei) => <EInvoiceGenerator key={ei.id} data={ei} />)}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Generate E-Way Bill</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#64748B] mb-1">Distance (km)</label>
              <input type="number" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={transport.distance_km || ''} onChange={(e) => setTransport({ ...transport, distance_km: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs text-[#64748B] mb-1">Vehicle Number</label>
              <input className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={transport.vehicle_no} onChange={(e) => setTransport({ ...transport, vehicle_no: e.target.value })} placeholder="e.g. MH12AB1234" />
            </div>
            <button className="w-full py-2 bg-[#16A34A] text-white rounded-lg text-sm font-medium hover:bg-green-700">Generate E-Way Bill</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EWayEInvoicePage;
