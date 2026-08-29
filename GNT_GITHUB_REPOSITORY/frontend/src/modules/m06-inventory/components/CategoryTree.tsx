import React from 'react';
import { Category } from '../services/inventory.types';

interface CategoryTreeProps {
  categories: Category[];
  onSelect?: (category: Category) => void;
  selectedId?: string;
  level?: number;
}

export const CategoryTree: React.FC<CategoryTreeProps> = ({ categories, onSelect, selectedId, level = 0 }) => {
  if (!categories?.length) return null;
  return (
    <ul className={`space-y-1 ${level > 0 ? 'ml-4 border-l border-[#E2E8F0] pl-3' : ''}`}>
      {categories.map((cat) => (
        <li key={cat.id}>
          <button onClick={() => onSelect?.(cat)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${selectedId === cat.id ? 'bg-[#2563EB] text-white' : 'text-[#0F172A] hover:bg-[#F8FAFC]'}`} style={{ fontFamily: 'Inter' }}>
            <span className="font-medium">{cat.name}</span>{cat.code && <span className="ml-2 text-xs opacity-70">({cat.code})</span>}
          </button>
          {cat.children && cat.children.length > 0 && <CategoryTree categories={cat.children} onSelect={onSelect} selectedId={selectedId} level={level + 1} />}
        </li>
      ))}
    </ul>
  );
};
