// ============================================================================
// M10 ACCOUNTING — BRSPage (बैंक मिलान, ROUGH placeholder)
// brs.controller.ts है पर routes अभी जुड़े नहीं — जुड़ते ही यह पेज असली मिलान दिखाएगा
// ============================================================================

import React from 'react';
import { Card } from '@/components/ui/Card';

export const BRSPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">बैंक मिलान (BRS)</h1>
      <Card>
        <p className="text-sm text-slate-500">
          बैंक मिलान के routes अभी जुड़े नहीं हैं (brs.controller बना है) — TODO: routes
          जुड़ते ही यह पेज असली मिलान दिखाएगा। कोई नक़ली आँकड़ा नहीं।
        </p>
      </Card>
    </div>
  );
};
