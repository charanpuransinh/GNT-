/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — TEMPLATES PAGE                          ║
 * ║  Lock Artifact #11 — Import & Export Template Management       ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { useEffect, useState } from 'react';
import { useImportExportStore } from '../store/importExportStore';
import { ImportTemplateAPI, ExportTemplateAPI } from '../services/importExportApi';
import {
  LayoutTemplate, Upload, Download, Star, Trash2, Edit3,
  FileSpreadsheet, FileJson, ChevronRight, Plus,
} from 'lucide-react';

const TemplatesPage = () => {
  const {
    importTemplates, exportTemplates, templatesLoading,
    setImportTemplates, setExportTemplates, setTemplatesLoading,
  } = useImportExportStore();

  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');

  useEffect(() => {
    fetchTemplates();
  }, [activeTab]);

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      if (activeTab === 'import') {
        const res = await ImportTemplateAPI.getAll();
        setImportTemplates(res.data.data);
      } else {
        const res = await ExportTemplateAPI.getAll();
        setExportTemplates(res.data.data);
      }
    } catch {
      if (activeTab === 'import') {
        setImportTemplates([
          {
            id: 'itmpl-001',
            tenantId: 't-001',
            name: 'Standard Lead Import',
            description: 'Default template for importing leads from CSV',
            entityType: 'leads',
            fileFormat: 'csv',
            mapping: [
              { sourceField: 'name', targetField: 'name', required: true },
              { sourceField: 'email', targetField: 'email', required: true },
              { sourceField: 'phone', targetField: 'phone', required: false },
            ],
            validationRules: [
              { field: 'name', rule: 'required', config: {}, errorMessage: 'Name is required' },
              { field: 'email', rule: 'email', config: {}, errorMessage: 'Invalid email' },
            ],
            sampleFileUrl: null,
            isDefault: true,
            createdBy: 'admin',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]);
      } else {
        setExportTemplates([
          {
            id: 'etmpl-001',
            tenantId: 't-001',
            name: 'Full Customer Export',
            description: 'Export all customer fields',
            entityType: 'customers',
            fileFormat: 'excel',
            selectedFields: ['id', 'name', 'email', 'phone', 'address', 'city', 'state', 'country'],
            filters: {},
            sortBy: 'name',
            sortOrder: 'asc',
            isDefault: true,
            createdBy: 'admin',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]);
      }
    } finally {
      setTemplatesLoading(false);
    }
  };

  const templates = activeTab === 'import' ? importTemplates : exportTemplates;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Manage import and export templates</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'import' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload size={14} /> Import Templates
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'export' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Download size={14} /> Export Templates
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {templatesLoading ? (
          <div className="p-12 text-center text-slate-400">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <LayoutTemplate size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">No {activeTab} templates</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Template</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Entity</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Format</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Default</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {templates.map((template: any) => (
                <tr key={template.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <LayoutTemplate size={16} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                        <p className="text-xs text-slate-500">{template.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                      {template.entityType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 uppercase">
                      {template.fileFormat}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {template.isDefault && (
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <Edit3 size={15} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TemplatesPage;
