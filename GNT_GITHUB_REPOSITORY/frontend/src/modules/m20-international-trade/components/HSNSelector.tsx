// GNT M20 — HSN Selector (Dropdown with Search)
// Owner: D4-DELTA

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { searchHSN } from '../services/internationalTrade.service';
import { HSNItem } from '../services/internationalTrade.types';

interface HSNSelectorProps {
  value?: string;
  onSelect: (hsn: HSNItem) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const HSNSelector: React.FC<HSNSelectorProps> = ({
  value,
  onSelect,
  placeholder = 'Search HSN code...',
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HSNItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<HSNItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const items = await searchHSN(q, 10);
        setResults(items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => debouncedSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, debouncedSearch]);

  useEffect(() => {
    if (value && !selected) {
      // optionally fetch by code
    }
  }, [value, selected]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (hsn: HSNItem) => {
    setSelected(hsn);
    setQuery(`${hsn.code} — ${hsn.description}`);
    setIsOpen(false);
    onSelect(hsn);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setSelected(null);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          color: '#0F172A',
          backgroundColor: disabled ? '#F1F5F9' : '#FFFFFF',
          outline: 'none',
        }}
      />
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            maxHeight: '240px',
            overflowY: 'auto',
            zIndex: 50,
          }}
        >
          {loading && (
            <div style={{ padding: '12px 14px', color: '#64748B', fontSize: '13px' }}>
              Searching…
            </div>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div style={{ padding: '12px 14px', color: '#64748B', fontSize: '13px' }}>
              No results found
            </div>
          )}
          {results.map((hsn) => (
            <button
              key={hsn.id}
              onClick={() => handleSelect(hsn)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                border: 'none',
                borderBottom: '1px solid #F1F5F9',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                color: '#0F172A',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ fontWeight: 600, color: '#2563EB' }}>{hsn.code}</div>
              <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>
                {hsn.description}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                GST: {hsn.gst_rate}% | IGST: {hsn.igst_rate}% | Cess: {hsn.cess_rate}%
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HSNSelector;
