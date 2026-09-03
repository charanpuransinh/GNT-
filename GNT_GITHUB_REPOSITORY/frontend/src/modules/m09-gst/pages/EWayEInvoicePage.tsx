// ============================================================================
// M09 GST — EWayEInvoicePage (ई-वे बिल / ई-इनवॉइस, ROUGH placeholder)
// ============================================================================

import React from 'react';
import { Card } from '@/components/ui/Card';

export const EWayEInvoicePage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">ई-वे बिल / ई-इनवॉइस</h1>
      <Card>
        <p className="text-sm text-slate-500">
          M09 चालू होते ही यह पेज ई-वे बिल और ई-इनवॉइस की पीढ़ी दिखाएगा (अभी cess_rate
          फैसला बाकी)। कोई नक़ली आँकड़ा नहीं।
        </p>
      </Card>
    </div>
  );
};
