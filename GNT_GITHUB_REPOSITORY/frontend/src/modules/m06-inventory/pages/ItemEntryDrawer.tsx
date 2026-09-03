// ============================================================================
// M06 INVENTORY — ItemEntryDrawer (नई/बदलाव माल का फ़ॉर्म, ROUGH)
// backend productSchema के हिसाब से (company_id backend खुद भरता है)
// ============================================================================

import React, { useState } from 'react';
import { apiClient } from '@/core/api-client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { type Product, type ProductDetailResponse } from '../types/inventory.types';

export interface ItemEntryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSaved: () => void;
}

interface ItemForm {
  name: string;
  code: string;
  barcode: string;
  hsn_code: string;
  unit: string;
  sale_price: string;
  purchase_price: string;
  gst_rate: string;
  reorder_level: string;
}

export const ItemEntryDrawer: React.FC<ItemEntryDrawerProps> = ({ isOpen, onClose, product, onSaved }) => {
  const [form, setForm] = useState<ItemForm>({
    name: product?.name ?? '',
    code: product?.code ?? '',
    barcode: product?.barcode ?? '',
    hsn_code: product?.hsn_code ?? '',
    unit: product?.unit ?? '',
    sale_price: product?.sale_price != null ? String(product.sale_price) : '',
    purchase_price: product?.purchase_price != null ? String(product.purchase_price) : '',
    gst_rate: product?.gst_rate != null ? String(product.gst_rate) : '',
    reorder_level: product?.reorder_level != null ? String(product.reorder_level) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof ItemForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const num = (v: string): number | null => (v.trim() === '' ? null : Number(v));

  const submit = async () => {
    if (!form.name.trim()) {
      setError('नाम ज़रूरी है');
      return;
    }
    const gst = num(form.gst_rate);
    if (gst !== null && (gst < 0 || gst > 100)) {
      setError('GST दर 0 से 100 के बीच हो');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        barcode: form.barcode.trim() || null,
        hsn_code: form.hsn_code.trim() || null,
        unit: form.unit.trim() || null,
        sale_price: num(form.sale_price),
        purchase_price: num(form.purchase_price),
        gst_rate: gst,
        reorder_level: num(form.reorder_level),
      };
      if (product) {
        await apiClient.put<ProductDetailResponse>(`/inventory/products/${product.id}`, body);
      } else {
        await apiClient.post<ProductDetailResponse>('/inventory/products', body);
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'सहेजने में गलती');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title={product ? 'माल बदलें' : 'नया माल'} onClose={onClose}>
      <div className="space-y-3">
        <Input label="नाम (ज़रूरी)" value={form.name} onChange={set('name')} />
        <Input label="कोड" value={form.code} onChange={set('code')} />
        <Input label="Barcode" value={form.barcode} onChange={set('barcode')} />
        <Input label="HSN कोड" value={form.hsn_code} onChange={set('hsn_code')} />
        <Input label="इकाई (जैसे pcs/kg)" value={form.unit} onChange={set('unit')} />
        <Input label="बिक्री दाम (₹)" value={form.sale_price} onChange={set('sale_price')} />
        <Input label="खरीद दाम (₹)" value={form.purchase_price} onChange={set('purchase_price')} />
        <Input label="GST %" value={form.gst_rate} onChange={set('gst_rate')} />
        <Input label="दोबारा मँगाने की सीमा" value={form.reorder_level} onChange={set('reorder_level')} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>रद्द</Button>
          <Button variant="primary" loading={saving} onClick={() => void submit()}>सहेजें</Button>
        </div>
      </div>
    </Modal>
  );
};
