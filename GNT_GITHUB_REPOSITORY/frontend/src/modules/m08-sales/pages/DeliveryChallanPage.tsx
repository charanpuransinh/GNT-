// ============================================================================
// M08 SALES — DeliveryChallanPage (चालान, ROUGH placeholder)
// backend में challan के routes अभी बने नहीं हैं (sales.routes.ts में नहीं) —
// इसलिए यहाँ ईमानदार जगह: बनते ही यह पेज उनसे जुड़ेगा।
// ============================================================================

import React from 'react';
import { Card } from '@/components/ui/Card';

export const DeliveryChallanPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">डिलीवरी चालान</h1>
      <Card>
        <p className="text-sm text-slate-500">
          चालान के backend routes अभी बने नहीं हैं (sales.routes.ts में नहीं) — TODO:
          routes बनते ही यह पेज असली प्रविष्टि से जुड़ेगा। कोई नक़ली डेटा नहीं दिखाते।
        </p>
      </Card>
    </div>
  );
};
