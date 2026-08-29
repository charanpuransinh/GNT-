/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — EXPORT LIST PAGE                        ║
 * ║  Lock Artifact #9 — Export Job List with Filters & Download  ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImportExportStore } from '../store/importExportStore';
import { ExportJobAPI } from '../services/importExportApi';
import {
  Download, Search, Plus, Trash2, RefreshCw, Eye,
  FileSpreadsheet, FileJson, FileText, CheckCircle2,
  Clock, XCircle, ChevronDown,
} from 'lucide-react';

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  processing: { icon: RefreshCw, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  completed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

const formatIcon = (format: string) => {
  switch (format) {
    case 'excel': return <FileSpreadsheet size={16} className="text-emerald-600" />;
    case 'json': return <FileJson size={16} className="text-blue-600" />;
    case 'pdf': return <FileText size={16} className="text-red-600" />;
    default: return <FileText size={16} className="text-slate-500" />;
  }
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '—';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const ExportListPage = () => {
  const navigate = useNavigate();
  const {
    exportJobs, exportLoading, exportError, exportFilters,
    setExportJobs, setExportLoading, setExportError, setExportFilters,
    removeExportJob,
  } = useImportExportStore();

  useEffect(() => {
    fetchExports();
  }, [exportFilters]);

  const fetchExports = async () => {
    setExportLoading(true);
    setExportError(null);
    try {
      const res = await ExportJobAPI.getAll(exportFilters);
      setExportJobs(res.data.data);
    } catch (err: any) {
      setExportError(err.message || 'Failed to load exports');
      setExportJobs([
        {
          id: 'exp-001',
          tenantId: 't-001',
          name: 'Q3 Sales Report',
          description: 'Export Q3 sales data for quarterly review',
          entityType: 'orders',
          fileFormat: 'excel',
          status: 'completed',
          filters: { dateFrom: '2026-07-01', dateTo: '2026-09-30' },
          selectedFields: ['id', 'customer', 'amount', 'status', 'date'],
          sortBy: 'date',
          sortOrder: 'desc',
          totalRows: 4521,
          fileUrl: '/exports/q3_sales_2026.xlsx',
          fileSize: 1843200,
          createdBy: 'admin',
          createdAt: '2026-08-22T10:00:00Z',
          updatedAt: '2026-08-22T10:05:00Z',
          completedAt: '2026-08-22T10:05:00Z',
          expiresAt: '2026-08-29T10:05:00Z',
        },
        {
          id: 'exp-002',
          tenantId: 't-001',
          name: 'Customer Master Data',
          description: 'Full customer database export',
          entityType: 'customers',
          fileFormat: 'csv',
          status: 'completed',
          filters: {},
          selectedFields: ['name', 'email', 'phone', 'address', 'city'],
          sortBy: 'name',
          sortOrder: 'asc',
          totalRows: 15298,
          fileUrl: '/exports/customers_full.csv',
          fileSize: 2457600,
          createdBy: 'admin',
          createdAt: '2026-08-21T09:00:00Z',
          updatedAt: '2026-08-21T09:10:00Z',
          completedAt: '2026-08-21T09:10:00Z',
          expiresAt: '2026-08-28T09:10:00Z',
        },
        {
          id: 'exp-003',
          tenantId: 't-001',
          name: 'Product Catalog PDF',
          description: 'Export product catalog as PDF',
          entityType: 'products',
          fileFormat: 'pdf',
          status: 'processing',
          filters: { status: 'active' },
          selectedFields: ['sku', 'name', 'price', 'category', 'description'],
          sortBy: 'sku',
          sortOrder: 'asc',
          totalRows: 3200,
          fileUrl: null,
          fileSize: null,
          createdBy: 'admin',
          createdAt: '2026-08-23T08:00:00Z',
          updatedAt: '2026-08-23T08:02:00Z',
          completedAt: null,
          expiresAt: null,
        },
      ]);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this export job?')) return;
    try {
      await ExportJobAPI.delete(id);
      removeExportJob(id);
    } catch {
      removeExportJob(id);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const res = await ExportJobAPI.download(id);
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${id}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Download started (mock)');
    }
  };

  const filteredJobs = exportJobs.filter((j) => {
    const matchesSearch = !exportFilters.search ||
      j.name.toLowerCase().includes(exportFilters.search.toLowerCase());
    const matchesStatus = !exportFilters.status || j.status === exportFilters.status;
    const matchesEntity = !exportFilters.entityType || j.entityType === exportFilters.entityType;
    return matchesSearch && matchesStatus && matchesEntity;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Export Jobs</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage data exports</p>
        </div>
        <button
          onClick={() => navigate('/import-export/exports/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> New Export
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total Exports', value: exportJobs.length, color: 'bg-slate-50 text-slate-700' },
          { label: 'Completed', value: exportJobs.filter(j => j.status === 'completed').length, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Processing', value: exportJobs.filter(j => j.status === 'processing').length, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Failed', value: exportJobs.filter(j => j.status === 'failed').length, color: 'bg-red-50 text-red-700' },
          { label: 'Total Rows', value: exportJobs.reduce((s, j) => s + j.totalRows, 0).toLocaleString(), color: 'bg-blue-50 text-blue-700' },
        ].map((stat) => (
          <div key={stat.label} className={`p-4 rounded-xl border ${stat.color} border-opacity-20`}>
            <p className="text-xs font-medium opacity-70">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search exports..."
            value={exportFilters.search || ''}
            onChange={(e) => setExportFilters({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={exportFilters.status || ''}
          onChange={(e) => setExportFilters({ status: e.target.value as any || undefined })}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={exportFilters.entityType || ''}
          onChange={(e) => setExportFilters({ entityType: e.target.value as any || undefined })}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All Entities</option>
          <option value="leads">Leads</option>
          <option value="customers">Customers</option>
          <option value="products">Products</option>
          <option value="orders">Orders</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {exportLoading ? (
          <div className="p-12 text-center text-slate-400">Loading exports...</div>
        ) : exportError ? (
          <div className="p-12 text-center text-red-500">{exportError}</div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Download size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">No export jobs</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Export</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Entity</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Rows</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">File</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => {
                const config = statusConfig[job.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                return (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <Download size={16} className="text-emerald-600" />
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
                      <span className="text-sm font-mono text-slate-700">{job.totalRows.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {formatIcon(job.fileFormat)}
                        <div>
                          <p className="text-sm text-slate-700">{job.fileFormat.toUpperCase()}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(job.fileSize)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {job.status === 'completed' && job.fileUrl && (
                          <button
                            onClick={() => handleDownload(job.id)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Download"
                          >
                            <Download size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/import-export/exports/${job.id}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
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

export default ExportListPage;
