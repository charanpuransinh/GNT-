import React, { useState, useEffect } from 'react';
import { FieldMapping } from '../types/importExport.types';

const MOCK_TEMPLATES = [
  {
    id: '1',
    name: 'Standard Product Import',
    entityType: 'product',
    description: 'Default template for importing products',
    fieldMapping: [
      { sourceColumn: 'Product Name', targetField: 'name', required: true },
      { sourceColumn: 'SKU', targetField: 'sku', required: true },
      { sourceColumn: 'Price', targetField: 'price', required: true },
      { sourceColumn: 'Stock', targetField: 'quantity', required: false }
    ],
    isDefault: true
  },
  {
    id: '2',
    name: 'Customer Bulk Upload',
    entityType: 'customer',
    description: 'Template for bulk customer import',
    fieldMapping: [
      { sourceColumn: 'Full Name', targetField: 'name', required: true },
      { sourceColumn: 'Email Address', targetField: 'email', required: true },
      { sourceColumn: 'Phone', targetField: 'phone', required: false }
    ],
    isDefault: true
  }
];

export const TemplatePage: React.FC = () => {
  const [templates, setTemplates] = useState(MOCK_TEMPLATES);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', entityType: 'product', description: '' });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">📋 Import Templates</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + New Template
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Template Name"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <select
              value={newTemplate.entityType}
              onChange={(e) => setNewTemplate({ ...newTemplate, entityType: e.target.value })}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="product">Product</option>
              <option value="customer">Customer</option>
              <option value="invoice">Invoice</option>
              <option value="order">Order</option>
            </select>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
                <p className="text-sm text-gray-500">{template.description}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                  {template.entityType}
                </span>
                {template.isDefault && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2 ml-2">
                    Default
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Field Mappings ({template.fieldMapping.length})</h4>
              <div className="space-y-1">
                {template.fieldMapping.map((fm, i) => (
                  <div key={i} className="flex items-center text-sm">
                    <span className="text-gray-600">{fm.sourceColumn}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="font-medium text-gray-800">{fm.targetField}</span>
                    {fm.required && <span className="ml-2 text-red-500 text-xs">*</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium">
                ⬇️ Download Sample
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
