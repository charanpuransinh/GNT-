import React, { useState } from 'react';
import { TaxSlabDTO } from '../services/gst.types';

interface Props {
  slabs: TaxSlabDTO[];
  onCreate: (slab: Partial<TaxSlabDTO>) => void;
  onToggle: (id: string, active: boolean) => void;
}

export const TaxSlabManager: React.FC<Props> = ({ slabs, onCreate, onToggle }) => {
  const [form, setForm] = useState<Partial<TaxSlabDTO>>({});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <input placeholder="Name" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="CGST %" type="number" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={form.cgst_rate || ''} onChange={(e) => setForm({ ...form, cgst_rate: Number(e.target.value) })} />
        <input placeholder="SGST %" type="number" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={form.sgst_rate || ''} onChange={(e) => setForm({ ...form, sgst_rate: Number(e.target.value) })} />
        <input placeholder="IGST %" type="number" className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={form.igst_rate || ''} onChange={(e) => setForm({ ...form, igst_rate: Number(e.target.value) })} />
      </div>
      <button onClick={() => { onCreate(form); setForm({}); }} className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium">Add Slab</button>
      <div className="space-y-2 mt-4">
        {slabs.map((slab) => (
          <div key={slab.id} className="flex justify-between items-center p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <div className="text-sm">
              <span className="font-medium text-[#0F172A]">{slab.name}</span>
              <span className="text-[#64748B] ml-3">CGST {slab.cgst_rate}% | SGST {slab.sgst_rate}% | IGST {slab.igst_rate}%</span>
            </div>
            <button onClick={() => onToggle(slab.id, !slab.is_active)} className={`px-3 py-1 rounded text-xs font-medium ${slab.is_active ? 'bg-red-50 text-[#DC2626]' : 'bg-green-50 text-[#16A34A]'}`}>{slab.is_active ? 'Deactivate' : 'Activate'}</button>
          </div>
        ))}
      </div>
    </div>
  );
};
