import React, { useState, useRef } from 'react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  placeholder?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, placeholder = 'Scan barcode...' }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) { onScan(value.trim()); setValue(''); inputRef.current?.focus(); }
  };
  return (
    <div className="relative">
      <input ref={inputRef} type="text" value={value} onChange={e => setValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder}
        className="w-full border border-[#E2E8F0] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent" autoFocus />
      <svg className="absolute left-3 top-2.5 w-5 h-5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    </div>
  );
};
