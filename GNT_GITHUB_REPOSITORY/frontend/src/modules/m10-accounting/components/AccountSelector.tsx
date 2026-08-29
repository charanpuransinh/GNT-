import React, { useState, useMemo } from 'react';
import { AccountDTO } from '../services/accounting.types';

interface Props {
  accounts: AccountDTO[];
  selected: AccountDTO | null;
  onSelect: (account: AccountDTO) => void;
}

export const AccountSelector: React.FC<Props> = ({ accounts, selected, onSelect }) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const matchesType = !typeFilter || a.type === typeFilter;
      const matchesQuery = !query || a.name.toLowerCase().includes(query.toLowerCase()) || a.code.toLowerCase().includes(query.toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [accounts, query, typeFilter]);

  return (
    <div className="relative">
      <div className="flex gap-2 mb-2">
        <input placeholder="Search account..." className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="asset">Asset</option>
          <option value="liability">Liability</option>
          <option value="equity">Equity</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>
      {selected && <div className="mb-2 px-3 py-1 bg-blue-50 text-[#2563EB] text-xs rounded inline-block">{selected.name} ({selected.code})</div>}
      {query && filtered.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-48 overflow-auto">
          {filtered.map((a) => (
            <button key={a.id} onClick={() => { onSelect(a); setQuery(''); }} className="w-full text-left px-4 py-2 hover:bg-[#F8FAFC] border-b border-[#E2E8F0] last:border-0 text-sm">
              <span className="font-medium text-[#0F172A]">{a.name}</span>
              <span className="text-[#64748B] ml-2 text-xs">({a.code})</span>
              <span className="float-right text-xs uppercase text-[#64748B]">{a.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
