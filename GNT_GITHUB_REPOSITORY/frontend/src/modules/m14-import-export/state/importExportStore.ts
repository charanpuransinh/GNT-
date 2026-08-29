/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — ZUSTAND STORE                           ║
 * ║  Lock Artifact #3 — State Management                         ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  ImportJob, ExportJob, ImportTemplate, ExportTemplate,
  ImportPreview, ImportProgress, ExportProgress,
  ImportFilters, ExportFilters, UploadResult,
} from '../types/importExport.types';

interface ImportExportState {
  // Import Jobs
  importJobs: ImportJob[];
  selectedImport: ImportJob | null;
  importLoading: boolean;
  importError: string | null;

  // Export Jobs
  exportJobs: ExportJob[];
  selectedExport: ExportJob | null;
  exportLoading: boolean;
  exportError: string | null;

  // Templates
  importTemplates: ImportTemplate[];
  exportTemplates: ExportTemplate[];
  templatesLoading: boolean;

  // Upload
  uploadResult: UploadResult | null;
  uploadLoading: boolean;
  uploadError: string | null;

  // Preview
  importPreview: ImportPreview | null;
  previewLoading: boolean;

  // Progress
  importProgress: ImportProgress | null;
  exportProgress: ExportProgress | null;

  // Filters
  importFilters: ImportFilters;
  exportFilters: ExportFilters;

  // UI
  sidebarOpen: boolean;
  activeTab: 'imports' | 'exports' | 'templates';
  importStep: 'upload' | 'map' | 'validate' | 'execute';
  exportStep: 'configure' | 'fields' | 'execute';

  // Actions — Imports
  setImportJobs: (jobs: ImportJob[]) => void;
  setSelectedImport: (job: ImportJob | null) => void;
  addImportJob: (job: ImportJob) => void;
  updateImportJob: (id: string, updates: Partial<ImportJob>) => void;
  removeImportJob: (id: string) => void;
  setImportLoading: (loading: boolean) => void;
  setImportError: (error: string | null) => void;

  // Actions — Exports
  setExportJobs: (jobs: ExportJob[]) => void;
  setSelectedExport: (job: ExportJob | null) => void;
  addExportJob: (job: ExportJob) => void;
  updateExportJob: (id: string, updates: Partial<ExportJob>) => void;
  removeExportJob: (id: string) => void;
  setExportLoading: (loading: boolean) => void;
  setExportError: (error: string | null) => void;

  // Actions — Templates
  setImportTemplates: (templates: ImportTemplate[]) => void;
  setExportTemplates: (templates: ExportTemplate[]) => void;
  setTemplatesLoading: (loading: boolean) => void;

  // Actions — Upload & Preview
  setUploadResult: (result: UploadResult | null) => void;
  setUploadLoading: (loading: boolean) => void;
  setUploadError: (error: string | null) => void;
  setImportPreview: (preview: ImportPreview | null) => void;
  setPreviewLoading: (loading: boolean) => void;

  // Actions — Progress
  setImportProgress: (progress: ImportProgress | null) => void;
  setExportProgress: (progress: ExportProgress | null) => void;

  // Actions — Filters & UI
  setImportFilters: (filters: Partial<ImportFilters>) => void;
  setExportFilters: (filters: Partial<ExportFilters>) => void;
  resetImportFilters: () => void;
  resetExportFilters: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: ImportExportState['activeTab']) => void;
  setImportStep: (step: ImportExportState['importStep']) => void;
  setExportStep: (step: ImportExportState['exportStep']) => void;
}

const initialImportFilters: ImportFilters = {
  status: undefined,
  entityType: undefined,
  search: '',
  dateFrom: undefined,
  dateTo: undefined,
};

const initialExportFilters: ExportFilters = {
  status: undefined,
  entityType: undefined,
  search: '',
  dateFrom: undefined,
  dateTo: undefined,
};

export const useImportExportStore = create<ImportExportState>()(
  devtools(
    persist(
      (set) => ({
        // Initial State
        importJobs: [],
        selectedImport: null,
        importLoading: false,
        importError: null,

        exportJobs: [],
        selectedExport: null,
        exportLoading: false,
        exportError: null,

        importTemplates: [],
        exportTemplates: [],
        templatesLoading: false,

        uploadResult: null,
        uploadLoading: false,
        uploadError: null,

        importPreview: null,
        previewLoading: false,

        importProgress: null,
        exportProgress: null,

        importFilters: initialImportFilters,
        exportFilters: initialExportFilters,

        sidebarOpen: true,
        activeTab: 'imports',
        importStep: 'upload',
        exportStep: 'configure',

        // Import Actions
        setImportJobs: (jobs) => set({ importJobs: jobs }),
        setSelectedImport: (job) => set({ selectedImport: job }),
        addImportJob: (job) => set((state) => ({ importJobs: [job, ...state.importJobs] })),
        updateImportJob: (id, updates) =>
          set((state) => ({
            importJobs: state.importJobs.map((j) =>
              j.id === id ? { ...j, ...updates } : j
            ),
          })),
        removeImportJob: (id) =>
          set((state) => ({
            importJobs: state.importJobs.filter((j) => j.id !== id),
          })),
        setImportLoading: (loading) => set({ importLoading: loading }),
        setImportError: (error) => set({ importError: error }),

        // Export Actions
        setExportJobs: (jobs) => set({ exportJobs: jobs }),
        setSelectedExport: (job) => set({ selectedExport: job }),
        addExportJob: (job) => set((state) => ({ exportJobs: [job, ...state.exportJobs] })),
        updateExportJob: (id, updates) =>
          set((state) => ({
            exportJobs: state.exportJobs.map((j) =>
              j.id === id ? { ...j, ...updates } : j
            ),
          })),
        removeExportJob: (id) =>
          set((state) => ({
            exportJobs: state.exportJobs.filter((j) => j.id !== id),
          })),
        setExportLoading: (loading) => set({ exportLoading: loading }),
        setExportError: (error) => set({ exportError: error }),

        // Template Actions
        setImportTemplates: (templates) => set({ importTemplates: templates }),
        setExportTemplates: (templates) => set({ exportTemplates: templates }),
        setTemplatesLoading: (loading) => set({ templatesLoading: loading }),

        // Upload & Preview
        setUploadResult: (result) => set({ uploadResult: result }),
        setUploadLoading: (loading) => set({ uploadLoading: loading }),
        setUploadError: (error) => set({ uploadError: error }),
        setImportPreview: (preview) => set({ importPreview: preview }),
        setPreviewLoading: (loading) => set({ previewLoading: loading }),

        // Progress
        setImportProgress: (progress) => set({ importProgress: progress }),
        setExportProgress: (progress) => set({ exportProgress: progress }),

        // Filters & UI
        setImportFilters: (filters) =>
          set((state) => ({ importFilters: { ...state.importFilters, ...filters } })),
        setExportFilters: (filters) =>
          set((state) => ({ exportFilters: { ...state.exportFilters, ...filters } })),
        resetImportFilters: () => set({ importFilters: initialImportFilters }),
        resetExportFilters: () => set({ exportFilters: initialExportFilters }),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setActiveTab: (tab) => set({ activeTab: tab }),
        setImportStep: (step) => set({ importStep: step }),
        setExportStep: (step) => set({ exportStep: step }),
      }),
      {
        name: 'm14-import-export-store',
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          activeTab: state.activeTab,
          importFilters: state.importFilters,
          exportFilters: state.exportFilters,
        }),
      }
    ),
    { name: 'ImportExportStore' }
  )
);
