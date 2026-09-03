// ============================================================================
// M10 ACCOUNTING — CashBankBookPage (रोकड़/बैंक बही, ROUGH placeholder)
// असली बही LedgerViewerPage से दिखती है — यह अलग किताब का दृश्य बाद में जुड़ेगा
// ============================================================================

import React from 'react';
import { Card } from '@/components/ui/Card';

export const CashBankBookPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">रोकड़/बैंक बही</h1>
      <Card>
        <p className="text-sm text-slate-500">
          रोकड़/बैंक का अलग दृश्य बाद में जुड़ेगा — अभी बही Ledger (बही) पेज से देखी जा
          सकती है। कोई नक़ली आँकड़ा नहीं।
        </p>
      </Card>
    </div>
  );
};
