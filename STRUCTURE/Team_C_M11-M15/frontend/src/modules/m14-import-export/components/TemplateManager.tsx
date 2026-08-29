// M14 Frontend — TemplateManager
// Lock: LOCK_07_COMPONENT
import React, { useEffect, useState } from 'react';
import { useTemplateStore } from '../../stores/template.store';
import { ErrorAlert } from '../Common/ErrorAlert';
import { ImportTemplate, ColumnMapping } from '../../types';

const MODULES = ['M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12', 'M13'];
const FILE_TYPES = ['csv', 'xlsx', 'json'];

interface Props {
  onSelectTemplate?: (template: ImportTemplate) => void;
}

export const TemplateManager: React.FC<Props> = ({ onSelectTemplate }) => {
  const { importTemplates, fetchTemplates, createTemplate, deleteTemplate, isLoading, error, clearError } = useTemplateStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', module: '', entityType: '', fileType: 'csv' as 'csv' | 'xlsx' | 'json',
    columnMapping: [] as ColumnMapping[], isDefault: false,
  });
  const [newMapping, setNewMapping] = useState({ sourceColumn: '', targetField: '', required: false });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const addMapping = () => {
    if (!newMapping.sourceColumn || !newMapping.targetField) return;
    setForm(prev => ({
      ...prev,
      columnMapping: [...prev.columnMapping, { ...newMapping }]
    }));
    setNewMapping({ sourceColumn: '', targetField: '', required: false });
  };

  const removeMapping = (idx: number) => {
    setForm(prev => ({
      ...prev,
      columnMapping: prev.columnMapping.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTemplate(form);
      setShowForm(false);
      setForm({ name: '', module: '', entityType: '', fileType: 'csv', columnMapping: [], isDefault: false });
    } catch {
      // handled in store
    }
  };

  return (
    <div className="space-y-4">
      <ErrorAlert message={error} onDismiss={clearError} />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Import Templates</h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
          {showForm ? 'Cancel' : '+ New Template'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-3 border">
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Template Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="border rounded px-3 py-2" />
            <select value={form.module} onChange={e => setForm(p => ({ ...p, module: e.target.value }))} className="border rounded px-3 py-2">
              <option value="">Module</option>
              {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input required placeholder="Entity Type" value={form.entityType} onChange={e => setForm(p => ({ ...p, entityType: e.target.value }))} className="border rounded px-3 py-2" />
            <select value={form.fileType} onChange={e => setForm(p => ({ ...p, fileType: e.target.value as any }))} className="border rounded px-3 py-2">
              {FILE_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>

          <div className="border rounded p-3 bg-white">
            <h4 className="text-sm font-medium mb-2">Column Mappings</h4>
            <div className="flex gap-2 mb-2">
              <input placeholder="CSV Column" value={newMapping.sourceColumn} onChange={e => setNewMapping(p => ({ ...p, sourceColumn: e.target.value }))} className="border rounded px-2 py-1 text-sm flex-1" />
              <input placeholder="DB Field" value={newMapping.targetField} onChange={e => setNewMapping(p => ({ ...p, targetField: e.target.value }))} className="border rounded px-2 py-1 text-sm flex-1" />
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={newMapping.required} onChange={e => setNewMapping(p => ({ ...p, required: e.target.checked }))} /> Required
              </label>
              <button type="button" onClick={addMapping} className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300">Add</button>
            </div>
            {form.columnMapping.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-sm bg-gray-50 px-2 py-1 rounded mb-1">
                <span>{m.sourceColumn} → {m.targetField} {m.required && <span className="text-red-500">*</span>}</span>
                <button type="button" onClick={() => removeMapping(i)} className="text-red-500 text-xs">Remove</button>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} />
            Set as default for this module/entity
          </label>

          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-300">
            {isLoading ? 'Saving...' : 'Save Template'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Module</th>
              <th className="px-3 py-2 text-left">Entity</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Default</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {importTemplates.map((tpl) => (
              <tr key={tpl.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => onSelectTemplate?.(tpl)}>
                <td className="px-3 py-2 font-medium">{tpl.name}</td>
                <td className="px-3 py-2">{tpl.module}</td>
                <td className="px-3 py-2">{tpl.entityType}</td>
                <td className="px-3 py-2 uppercase">{tpl.fileType}</td>
                <td className="px-3 py-2">{tpl.isDefault ? '✅' : ''}</td>
                <td className="px-3 py-2">
                  <button onClick={(e) => { e.stopPropagation(); deleteTemplate(tpl.id); }} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
            {importTemplates.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">No templates found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
