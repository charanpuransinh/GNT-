import React, { useState, useMemo } from 'react';
import { HSNDTO } from '../services/gst.types';

interface Props {
  hsnCodes: HSNDTO[];
  onSelect: (hsn: HSNDTO) => void;
}

export const HSNCodeSearch: React.FC<Props> = ({ hsnCodes, onSelect }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return [];
    return hsnCodes.filter((h) => h.hsn_code.includes(query) || (h.description && h.description.toLowerCase().includes(query.toLowerCase())));
  }, [query, hsnCodes]);

  return (
    <div className="relative">
      <input placeholder="Search HSN/SAC code or description..." className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={query} onChange={(e) => setQuery(e.target.value)} />
      {filtered.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-60 overflow-auto">
          {filtered.map((hsn) => (
            <button key={hsn.id} onClick={() => { onSelect(hsn); setQuery(''); }} className="w-full text-left px-4 py-2 hover:bg-[#F8FAFC] border-b border-[#E2E8F0] last:border-0">
              <div className="flex justify-between">
                <span className="font-mono font-medium text-[#2563EB]">{hsn.hsn_code}</span>
                <span className="text-xs text-[#64748B]">{hsn.type}</span>
              </div>
              <p className="text-xs text-[#64748B] truncate">{hsn.description}</p>
              <p className="text-xs font-medium text-[#0F172A]">GST: {hsn.gst_rate}%</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
