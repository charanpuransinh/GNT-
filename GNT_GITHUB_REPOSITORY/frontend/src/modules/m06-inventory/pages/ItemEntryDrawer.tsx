import React, { useState, useEffect } from 'react';
import { Product, ProductFormData, Category } from '../services/inventory.types';
import { inventoryActions } from '../state/inventory.actions';
import { useInventoryStore } from '../state/inventory.store';
import { UNITS, GST_RATES } from '../services/inventory.constants';
import { productFormSchema } from '../validators/inventory.schema';
import { ZodError } from 'zod';

interface ItemEntryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: () => void;
}

export const ItemEntryDrawer: React.FC<ItemEntryDrawerProps> = ({ isOpen, onClose, product, onSave }) => {
  const [form, setForm] = useState<ProductFormData>({
    name: '', code: '', barcode: '', hsn_code: '', category_id: '', unit: '', alternate_unit: '',
    conversion_rate: undefined, sale_price: undefined, purchase_price: undefined, mrp: undefined,
    gst_rate: undefined, cess_rate: undefined, is_gst_inclusive: false,
    min_stock: undefined, max_stock: undefined, reorder_level: undefined,
    description: '', image_url: '', is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    inventoryActions.fetchCategories().then(() => { setCategories(useInventoryStore.getState().categories); });
  }, []);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name, code: product.code || '', barcode: product.barcode || '', hsn_code: product.hsn_code || '',
        category_id: product.category_id || '', unit: product.unit || '', alternate_unit: product.alternate_unit || '',
        conversion_rate: product.conversion_rate || undefined, sale_price: product.sale_price || undefined,
        purchase_price: product.purchase_price || undefined, mrp: product.mrp || undefined,
        gst_rate: product.gst_rate || undefined, cess_rate: product.cess_rate || undefined,
        is_gst_inclusive: product.is_gst_inclusive || false, min_stock: product.min_stock || undefined,
        max_stock: product.max_stock || undefined, reorder_level: product.reorder_level || undefined,
        description: product.description || '', image_url: product.image_url || '', is_active: product.is_active ?? true,
      });
    } else {
      setForm({ name: '', code: '', barcode: '', hsn_code: '', category_id: '', unit: '', alternate_unit: '',
        conversion_rate: undefined, sale_price: undefined, purchase_price: undefined, mrp: undefined,
        gst_rate: undefined, cess_rate: undefined, is_gst_inclusive: false,
        min_stock: undefined, max_stock: undefined, reorder_level: undefined,
        description: '', image_url: '', is_active: true,
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      productFormSchema.parse(form);
      if (product) { await inventoryActions.updateProduct(product.id, form); }
      else { await inventoryActions.createProduct(form); }
      onSave();
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach(e => { if (e.path[0]) fieldErrors[e.path[0] as string] = e.message; });
        setErrors(fieldErrors);
      }
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl" style={{ fontFamily: 'Inter' }}>
        <div className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0F172A]">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A] text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">Product Name *</label>
            <input value={form.name} onChange={e => handleChange('name', e.target.value)} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${errors.name ? 'border-[#DC2626]' : 'border-[#E2E8F0]'}`} />
            {errors.name && <p className="text-[#DC2626] text-xs mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Code</label><input value={form.code} onChange={e => handleChange('code', e.target.value)} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Barcode</label><input value={form.barcode} onChange={e => handleChange('barcode', e.target.value)} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Category</label><select value={form.category_id} onChange={e => handleChange('category_id', e.target.value)} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm bg-white"><option value="">Select Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">HSN Code</label><input value={form.hsn_code} onChange={e => handleChange('hsn_code', e.target.value)} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Unit</label><select value={form.unit} onChange={e => handleChange('unit', e.target.value)} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm bg-white"><option value="">Select</option>{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Alt Unit</label><select value={form.alternate_unit} onChange={e => handleChange('alternate_unit', e.target.value)} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm bg-white"><option value="">Select</option>{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Conversion</label><input type="number" value={form.conversion_rate || ''} onChange={e => handleChange('conversion_rate', Number(e.target.value))} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Purchase Price</label><input type="number" step="0.01" value={form.purchase_price || ''} onChange={e => handleChange('purchase_price', Number(e.target.value))} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Sale Price</label><input type="number" step="0.01" value={form.sale_price || ''} onChange={e => handleChange('sale_price', Number(e.target.value))} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">MRP</label><input type="number" step="0.01" value={form.mrp || ''} onChange={e => handleChange('mrp', Number(e.target.value))} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">GST %</label><select value={form.gst_rate || ''} onChange={e => handleChange('gst_rate', Number(e.target.value))} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm bg-white"><option value="">Select</option>{GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}</select></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">CESS %</label><input type="number" value={form.cess_rate || ''} onChange={e => handleChange('cess_rate', Number(e.target.value))} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
            <div className="flex items-center pt-6"><input type="checkbox" id="gst_inclusive" checked={form.is_gst_inclusive} onChange={e => handleChange('is_gst_inclusive', e.target.checked)} className="w-4 h-4 rounded border-[#E2E8F0] text-[#2563EB]" /><label htmlFor="gst_inclusive" className="ml-2 text-sm text-[#0F172A]">GST Inclusive</label></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Min Stock</label><input type="number" value={form.min_stock || ''} onChange={e => handleChange('min_stock', Number(e.target.value))} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Max Stock</label><input type="number" value={form.max_stock || ''} onChange={e => handleChange('max_stock', Number(e.target.value))} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Reorder Level</label><input type="number" value={form.reorder_level || ''} onChange={e => handleChange('reorder_level', Number(e.target.value))} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
          </div>
          <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Description</label><textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={3} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm resize-none" /></div>
          <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Image URL</label><input value={form.image_url} onChange={e => handleChange('image_url', e.target.value)} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
          <div className="flex items-center gap-3 pt-2"><input type="checkbox" id="is_active" checked={form.is_active} onChange={e => handleChange('is_active', e.target.checked)} className="w-4 h-4 rounded border-[#E2E8F0] text-[#2563EB]" /><label htmlFor="is_active" className="text-sm text-[#0F172A]">Active</label></div>
          <div className="sticky bottom-0 bg-white border-t border-[#E2E8F0] pt-4 pb-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  );
};
