import React, { useState, useEffect } from 'react';
import { useInventoryStore } from '../state/inventory.store';
import { inventoryActions } from '../state/inventory.actions';
import { CategoryTree } from '../components/CategoryTree';
import { Category } from '../services/inventory.types';
import { inventoryService } from '../services/inventory.service';

export const CategoryUnitPage: React.FC = () => {
  const { categories } = useInventoryStore();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', parent_id: '', code: '', description: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { inventoryActions.fetchCategoryTree(); }, []);

  const handleSelect = (cat: Category) => {
    setSelectedCategory(cat);
    setForm({ name: cat.name, parent_id: cat.parent_id || '', code: cat.code || '', description: cat.description || '' });
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && selectedCategory) { await inventoryService.updateCategory(selectedCategory.id, form); }
    else { await inventoryService.createCategory(form); }
    inventoryActions.fetchCategoryTree();
    setSelectedCategory(null); setForm({ name: '', parent_id: '', code: '', description: '' }); setIsEditing(false);
  };

  const handleDelete = async () => {
    if (selectedCategory && confirm('Delete this category?')) {
      await inventoryService.deleteCategory(selectedCategory.id);
      inventoryActions.fetchCategoryTree(); setSelectedCategory(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6" style={{ fontFamily: 'Inter' }}>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Categories</h2>
            <button onClick={() => { setSelectedCategory(null); setForm({ name: '', parent_id: '', code: '', description: '' }); setIsEditing(false); }} className="px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-medium">+ New</button>
          </div>
          <CategoryTree categories={categories} onSelect={handleSelect} selectedId={selectedCategory?.id} />
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">{isEditing ? 'Edit Category' : 'New Category'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" required /></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Parent Category</label><select value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm bg-white"><option value="">None (Root)</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Code</label><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm" /></div>
            <div><label className="block text-sm font-medium text-[#0F172A] mb-1">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm resize-none" /></div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium">{isEditing ? 'Update' : 'Create'}</button>
              {isEditing && <button type="button" onClick={handleDelete} className="px-4 py-2.5 bg-[#DC2626] text-white rounded-lg text-sm font-medium">Delete</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
