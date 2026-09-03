// ============================================================================
// M09 GST — GSTReturnsPage (GSTR1/GSTR3B, ROUGH placeholder)
// M09 mount होते ही असली returns दिखाएगा (अभी cess_rate फैसला बाकी)
// ============================================================================

import React from 'react';
import { Card } from '@/components/ui/Card';

export const GSTReturnsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">GST Returns (GSTR1 / GSTR3B)</h1>
      <Card>
        <p className="text-sm text-slate-500">
          M09 अभी ऐप में चालू नहीं है (tax_rate_master में cess_rate का schema गैप —
          समीक्षक AI का फैसला बाकी)। चालू होते ही यह पेज असली GSTR1/GSTR3B दिखाएगा।
          कोई नक़ली आँकड़ा नहीं।
        </p>
      </Card>
    </div>
  );
};
