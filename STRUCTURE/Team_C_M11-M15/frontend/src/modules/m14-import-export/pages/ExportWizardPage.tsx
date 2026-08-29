/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — EXPORT WIZARD PAGE                      ║
 * ║  Lock Artifact #10 — 3-Step Export Flow (Configure/Fields/Execute)
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useImportExportStore } from '../store/importExportStore';
import { ExportJobAPI } from '../services/importExportApi';
import {
  Download, ArrowRight, Check, ChevronRight, Settings,
  ListChecks, Play, X, Eye,
} from 'lucide-react';

interface WizardProps {
  viewMode?: boolean;
}

const steps = [
  { key: 'configure', label: 'Configure', icon: Settings },
  { key: 'fields', label: 'Select Fields', icon: ListChecks },
  { key: 'execute', label: 'Execute', icon: Play },
];

const entityOptions = ['leads', 'contacts', 'products', 'orders', 'invoices', 'customers', 'employees'];
const formatOptions = ['csv', 'excel', 'json', 'pdf'];

const fieldDefinitions: Record<string, string[]> = {
  leads: ['id', 'name', 'email', 'phone', 'company', 'status', 'source', 'createdAt', 'updatedAt'],
  customers: ['id', 'name', 'email', 'phone', 'address', 'city', 'state', 'country', 'createdAt'],
  products: ['id', 'sku', 'name', 'description', 'price', 'quantity', 'category', 'status'],
  orders: ['id', 'customerId', 'amount', 'status', 'date', 'items', 'shippingAddress'],
};

const ExportWizardPage = ({ viewMode }: WizardProps) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { exportStep, setExportStep } = useImportExportStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [entityType, setEntityType] = useState('leads');
  const [fileFormat, setFileFormat] = useState('csv');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [executing, setExecuting] = useState(false);

  const availableFields = fieldDefinitions[entityType] || [];

  const toggleField = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const selectAll = () => setSelectedFields([...availableFields]);
  const deselectAll = () => setSelectedFields([]);

  const handleCreate = async () => {
    try {
      const res = await ExportJobAPI.create({
        name: name || `${entityType} export`,
        description,
        entityType,
        fileFormat,
        selectedFields,
        sortBy,
        sortOrder,
        filters: {},
      });
      setCurrentStep(2);
      return res.data.data.id;
    } catch {
      setCurrentStep(2);
      return `exp-${Date.now()}`;
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const jobId = id || await handleCreate();
      await ExportJobAPI.execute(jobId);
      navigate('/import-export/exports');
    } catch {
      setExecuting(false);
      navigate('/import-export/exports');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/import-export/exports')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{viewMode ? 'Export Details' : 'New Export'}</h1>
            <p className="text-xs text-slate-500">Configure and export data</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          return (
            <div key={step.key} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-emerald-600 text-white' :
                isDone ? 'bg-emerald-50 text-emerald-700' :
                'bg-slate-100 text-slate-400'
              }`}>
                {isDone ? <Check size={14} /> : <Icon size={14} />}
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {idx < steps.length - 1 && <ChevronRight size={16} className="text-slate-300" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Configure */}
      {currentStep === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Export Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q3 Sales Report"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Entity Type</label>
              <select
                value={entityType}
                onChange={(e) => { setEntityType(e.target.value); setSelectedFields([]); }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {entityOptions.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this export for?"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">File Format</label>
            <div className="grid grid-cols-4 gap-3">
              {formatOptions.map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setFileFormat(fmt)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    fileFormat === fmt
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <p className="text-sm font-semibold uppercase">{fmt}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep(1)}
              disabled={!entityType}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Next: Select Fields <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Fields */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Select Fields to Export</h3>
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Select All</button>
              <span className="text-slate-300">|</span>
              <button onClick={deselectAll} className="text-xs text-slate-500 hover:text-slate-700 font-medium">Deselect All</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {availableFields.map(field => (
              <label
                key={field}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedFields.includes(field)
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field)}
                  onChange={() => toggleField(field)}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <span className="text-sm text-slate-700">{field}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                {availableFields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sort Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(0)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              disabled={selectedFields.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Next: Execute <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Execute */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Download size={28} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Ready to Export</h3>
            <p className="text-sm text-slate-500 mt-1">
              {selectedFields.length} fields from {entityType} will be exported as {fileFormat.toUpperCase()}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Entity</p>
              <p className="text-sm font-bold text-slate-900 capitalize">{entityType}</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Format</p>
              <p className="text-sm font-bold text-slate-900 uppercase">{fileFormat}</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Fields</p>
              <p className="text-sm font-bold text-slate-900">{selectedFields.length}</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Sort</p>
              <p className="text-sm font-bold text-slate-900">{sortBy} {sortOrder}</p>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={handleExecute}
              disabled={executing}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {executing ? (
                <><RefreshCw size={15} className="animate-spin" /> Processing...</>
              ) : (
                <><Play size={15} /> Start Export</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportWizardPage;
