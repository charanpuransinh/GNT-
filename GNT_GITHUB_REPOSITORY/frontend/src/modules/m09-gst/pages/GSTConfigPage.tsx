import React, { useEffect, useState } from 'react';
import { useGSTStore } from '../state/gst.store';
import { GSTService } from '../services/gst.service';
import { TaxSlabDTO, HSNDTO } from '../services/gst.types';

const GSTConfigPage: React.FC<{ companyId: string }> = ({ companyId }) => {
  const { taxSlabs, hsnCodes, setTaxSlabs, setHSNCodes, loading, setLoading } = useGSTStore();
  const [newSlab, setNewSlab] = useState<Partial<TaxSlabDTO>>({});

  useEffect(() => {
    setLoading(true);
    GSTService.getTaxSlabs(companyId).then((slabs) => {
      setTaxSlabs(slabs);
      setLoading(false);
    });
  }, [companyId]);

  const handleCreateSlab = async () => {
    const slab = await GSTService.createTaxSlab({ ...newSlab, company_id: companyId });
    setTaxSlabs([...taxSlabs, slab]);
    setNewSlab({});
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">GST Configuration</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Tax Slabs</h2>
          <div className="space-y-3 mb-4">
            <input placeholder="Name" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={newSlab.name || ''} onChange={(e) => setNewSlab({ ...newSlab, name: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="CGST %" type="number" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={newSlab.cgst_rate || ''} onChange={(e) => setNewSlab({ ...newSlab, cgst_rate: Number(e.target.value) })} />
              <input placeholder="SGST %" type="number" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={newSlab.sgst_rate || ''} onChange={(e) => setNewSlab({ ...newSlab, sgst_rate: Number(e.target.value) })} />
              <input placeholder="IGST %" type="number" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={newSlab.igst_rate || ''} onChange={(e) => setNewSlab({ ...newSlab, igst_rate: Number(e.target.value) })} />
            </div>
            <button onClick={handleCreateSlab} className="w-full py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Add Tax Slab</button>
          </div>
          <div className="space-y-2">
            {taxSlabs.map((slab) => (
              <div key={slab.id} className="flex justify-between items-center p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <div>
                  <p className="font-medium text-[#0F172A] text-sm">{slab.name}</p>
                  <p className="text-xs text-[#64748B]">CGST: {slab.cgst_rate}% | SGST: {slab.sgst_rate}% | IGST: {slab.igst_rate}%</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${slab.is_active ? 'bg-green-100 text-[#16A34A]' : 'bg-gray-100 text-[#64748B]'}`}>{slab.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">HSN / SAC Master</h2>
          <div className="space-y-2">
            {hsnCodes.map((hsn) => (
              <div key={hsn.id} className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <div className="flex justify-between">
                  <span className="font-mono font-medium text-[#2563EB]">{hsn.hsn_code}</span>
                  <span className="text-xs uppercase px-2 py-0.5 bg-blue-50 text-[#2563EB] rounded">{hsn.type}</span>
                </div>
                <p className="text-sm text-[#64748B] mt-1">{hsn.description}</p>
                <p className="text-xs text-[#64748B] mt-1">GST: {hsn.gst_rate}% | CESS: {hsn.cess_rate || 0}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GSTConfigPage;
