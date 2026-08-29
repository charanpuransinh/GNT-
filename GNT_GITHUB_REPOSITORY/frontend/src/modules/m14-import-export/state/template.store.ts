// M14 Frontend — Template Store (Zustand)
// Lock: LOCK_03_STORE
import { create } from 'zustand';
import { templateApi } from '../api';
import { ImportTemplate, ExportTemplate, ColumnMapping } from '../types';

interface TemplateState {
  importTemplates: ImportTemplate[];
  exportTemplates: ExportTemplate[];
  currentTemplate: ImportTemplate | ExportTemplate | null;
  isLoading: boolean;
  error: string | null;

  fetchTemplates: (params?: { module?: string; entityType?: string }) => Promise<void>;
  createTemplate: (data: Partial<ImportTemplate>) => Promise<ImportTemplate>;
  updateTemplate: (id: string, data: Partial<ImportTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  setCurrentTemplate: (template: ImportTemplate | ExportTemplate | null) => void;
  clearError: () => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  importTemplates: [],
  exportTemplates: [],
  currentTemplate: null,
  isLoading: false,
  error: null,

  fetchTemplates: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const templates = await templateApi.list(params);
      set({ importTemplates: templates, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
    }
  },

  createTemplate: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const tpl = await templateApi.create(data);
      set((state) => ({
        importTemplates: [tpl, ...state.importTemplates],
        isLoading: false,
      }));
      return tpl;
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
      throw err;
    }
  },

  updateTemplate: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const tpl = await templateApi.update(id, data);
      set((state) => ({
        importTemplates: state.importTemplates.map((t) => (t.id === id ? tpl : t)),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
    }
  },

  deleteTemplate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await templateApi.delete(id);
      set((state) => ({
        importTemplates: state.importTemplates.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.error || err.message });
    }
  },

  setCurrentTemplate: (template) => set({ currentTemplate: template }),
  clearError: () => set({ error: null }),
}));
