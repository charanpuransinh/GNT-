// ============================================================================
// M07 PURCHASE — SupplierPaymentPage (सप्लायर को भुगतान, ROUGH placeholder)
// भुगतान की असली मशीनरी M11 (Payment) में है — M11 के पेज बनते ही यह वहीं से
// जुड़ेगी। अभी सिर्फ़ जगह + पता, झूठा कुछ नहीं दिखाते।
// ============================================================================

import React from 'react';
import { Card } from '@/components/ui/Card';

export const SupplierPaymentPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">सप्लायर को भुगतान</h1>
      <Card>
        <p className="text-sm text-slate-500">
          भुगतान की असली मशीनरी M11 (Payment) में है — TODO: M11 के पेज बनते ही यहाँ
          सप्लायर का बकाया + भुगतान-प्रविष्टि जुड़ेगी। अभी कोई नक़ली आँकड़ा नहीं दिखाते।
        </p>
      </Card>
    </div>
  );
};
