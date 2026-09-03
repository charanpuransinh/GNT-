// ============================================================================
// M09 GST — GSTR2BReconciliationPage (खरीद मिलान, ROUGH placeholder)
// ============================================================================

import React from 'react';
import { Card } from '@/components/ui/Card';

export const GSTR2BReconciliationPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">GSTR2B मिलान</h1>
      <Card>
        <p className="text-sm text-slate-500">
          M09 चालू होते ही यह पेज खरीद का GSTR2B से मिलान दिखाएगा (अभी cess_rate फैसला
          बाकी)। कोई नक़ली आँकड़ा नहीं।
        </p>
      </Card>
    </div>
  );
};
