/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — IMPORT LIST PAGE                        ║
 * ║  Lock Artifact #7 — Import Job List with Filters & Actions   ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImportExportStore } from '../store/importExportStore';
import { ImportJobAPI } from '../services/importExportApi';
import {
  Upload, Search, Plus, Trash2, RefreshCw, Eye,
  FileSpreadsheet, FileJson, FileText, AlertTriangle,
  CheckCircle2, Clock, XCircle, Pause, ChevronDown,
  Download, Filter,
} from 'lucide-react';

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  validating: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  processing: { icon: RefreshCw, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  completed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  partial: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
};

const formatIcon = (format: string) => {
  switch (format) {
    case 'excel': return <FileSpreadsheet size={16} className="text-emerald-600" />;
    case 'json': return <FileJson size={16} className="text-blue-600" />;
    default: return <FileText size={16} className="text-slate-500" />;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const ImportListPage = () => {
  const navigate = useNavigate();
  const {
    importJobs, importLoading, importError, importFilters,
    setImportJobs, setImportLoading, setImportError, setImportFilters,
    removeImportJob, updateImportJob,
  } = useImportExportStore();

  useEffect(() => {
    fetchImports();
  }, [importFilters]);

  const fetchImports = async () => {
    setImportLoading(true);
    setImportError(null);
    try {
      const res = await ImportJobAPI.getAll(importFilters);
      setImportJobs(res.data.data);
    } catch (err: any) {
      setImportError(err.message || 'Failed to load imports');
      // TEMP MOCK
      setImportJobs([
        {
          id: 'imp-001',
          tenantId: 't-001',
          name: 'Q3 Leads Import',
          description: 'Import Q3 lead data from CRM export',
          entityType: 'leads',
          fileFormat: 'csv',
          fileName: 'q3_leads_2026.csv',
          fileSize: 2457600,
          fileUrl: '/uploads/t-001/imports/q3_leads_2026.csv',
          status: 'completed',
          mapping: [],
          mappingStrategy: 'auto',
          validationRules: [],
          totalRows: 15420,
          processedRows: 15420,
          successRows: 15298,
          failedRows: 122,
          skippedRows: 0,
          errors: [],
          createdBy: 'admin',
          createdAt: '2026-08-20T10:00:00Z',
          updatedAt: '2026-08-20T10:15:00Z',
          completedAt: '2026-08-20T10:15:00Z',
          dryRun: false,
        },
        {
          id: 'imp-002',
          tenantId: 't-001',
          name: 'Customer Database Sync',
          description: 'Bulk customer import from legacy system',
          entityType: 'customers',
          fileFormat: 'excel',
          fileName: 'customers_legacy.xlsx',
          fileSize: 5120000,
          fileUrl: '/uploads/t-001/imports/customers_legacy.xlsx',
          status: 'partial',
          mapping: [],
          mappingStrategy: 'manual',
          validationRules: [],
          totalRows: 8500,
          processedRows: 8500,
          successRows: 8234,
          failedRows: 266,
          skippedRows: 0,
          errors: [],
          createdBy: 'admin',
          createdAt: '2026-08-21T09:00:00Z',
          updatedAt: '2026-08-21T09:30:00Z',
          completedAt: '2026-08-21T09:30:00Z',
          dryRun: false,
        },
        {
          id: 'imp-003',
          tenantId: 't-001',
          name: 'Product Catalog Update',
          description: 'Update product pricing and inventory',
          entityType: 'products',
          fileFormat: 'csv',
          fileName: 'products_update.csv',
          fileSize: 890000,
          fileUrl: '/uploads/t-001/imports/products_update.csv',
          status: 'processing',
          mapping: [],
          mappingStrategy: 'template',
          validationRules: [],
          totalRows: 3200,
          processedRows: 1850,
          successRows: 1850,
          failedRows: 0,
          skippedRows: 0,
          errors: [],
          createdBy: 'admin',
          createdAt: '2026-08-23T08:00:00Z',
          updatedAt: '2026-08-23T08:05:00Z',
          completedAt: null,
          dryRun: false,
        },
      ]);
    } finally {
      setImportLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this import job?')) return;
    try {
      await ImportJobAPI.delete(id);
      removeImportJob(id);
    } catch {
      removeImportJob(id);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await ImportJobAPI.retry(id);
      fetchImports();
    } catch {
      fetchImports();
    }
  };

  const filteredJobs = importJobs.filter((j) => {
    const matchesSearch = !importFilters.search ||
      j.name.toLowerCase().includes(importFilters.search.toLowerCase()) ||
      j.fileName.toLowerCase().includes(importFilters.search.toLowerCase());
    const matchesStatus = !importFilters.status || j.status === importFilters.status;
    const matchesEntity = !importFilters.entityType || j.entityType === importFilters.entityType;
    return matchesSearch && matchesStatus && matchesEntity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import Jobs</h1>
          <p className="text-sm text-slate-500 mt-1">Upload and manage data imports</p>
        </div>
        <button
          onClick={() => navigate('/import-export/imports/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> New Import
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total Imports', value: importJobs.length, color: 'bg-slate-50 text-slate-700' },
          { label: 'Completed', value: importJobs.filter(j => j.status === 'completed').length, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Processing', value: importJobs.filter(j => j.status === 'processing').length, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Failed/Partial', value: importJobs.filter(j => j.status === 'failed' || j.status === 'partial').length, color: 'bg-red-50 text-red-700' },
          { label: 'Total Rows', value: importJobs.reduce((s, j) => s + j.totalRows, 0).toLocaleString(), color: 'bg-blue-50 text-blue-700' },
        ].map((stat) => (
          <div key={stat.label} className={`p-4 rounded-xl border ${stat.color} border-opacity-20`}>
            <p className="text-xs font-medium opacity-70">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search imports..."
            value={importFilters.search || ''}
            onChange={(e) => setImportFilters({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={importFilters.status || ''}
          onChange={(e) => setImportFilters({ status: e.target.value as any || undefined })}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="validating">Validating</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="partial">Partial</option>
        </select>
        <select
          value={importFilters.entityType || ''}
          onChange={(e) => setImportFilters({ entityType: e.target.value as any || undefined })}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All Entities</option>
          <option value="leads">Leads</option>
          <option value="customers">Customers</option>
          <option value="products">Products</option>
          <option value="contacts">Contacts</option>
        </select>
        {(importFilters.search || importFilters.status || importFilters.entityType) && (
          <button
            onClick={() => setImportFilters({ status: undefined, search: '', entityType: undefined })}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {importLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
            Loading imports...
          </div>
        ) : importError ? (
          <div className="p-12 text-center text-red-500">
            <p className="font-medium">Error loading imports</p>
            <p className="text-sm mt-1">{importError}</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Upload size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">No import jobs</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Import</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Entity</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Progress</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">File</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => {
                const config = statusConfig[job.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const progress = job.totalRows > 0 ? Math.round((job.processedRows / job.totalRows) * 100) : 0;
                return (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <Upload size={16} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{job.name}</p>
                          <p className="text-xs text-slate-500">{job.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                        {job.entityType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color} border-opacity-30`}>
                        <StatusIcon size={13} />
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full max-w-[120px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-600">{progress}%</span>
                          <span className="text-slate-400">{job.successRows.toLocaleString()}/{job.totalRows.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              job.status === 'completed' ? 'bg-emerald-500' :
                              job.status === 'failed' ? 'bg-red-500' :
                              job.status === 'partial' ? 'bg-orange-500' :
                              'bg-indigo-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {job.failedRows > 0 && (
                          <p className="text-[10px] text-red-500 mt-0.5">{job.failedRows} failed</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {formatIcon(job.fileFormat)}
                        <div>
                          <p className="text-sm text-slate-700">{job.fileName}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(job.fileSize)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/import-export/imports/${job.id}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
                        {(job.status === 'failed' || job.status === 'partial') && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                            title="Retry"
                          >
                            <RefreshCw size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ImportListPage;
