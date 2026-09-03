/**
 * M18 — Integration State Store (Zustand)
 * Owner: D4-DELTA
 */
import { create } from 'zustand';
import { IntegrationConfig, GatewayStatusDto, ApiKeyResponse } from '../services/integration.types';

interface IntegrationState {
  integrations: IntegrationConfig[];
  statusMap: GatewayStatusDto[];
  apiKeys: ApiKeyResponse[];
  isLoading: boolean;
  error: string | null;
  selectedIntegration: IntegrationConfig | null;
  generatedKey: string | null;

  setIntegrations: (items: IntegrationConfig[]) => void;
  setStatusMap: (items: GatewayStatusDto[]) => void;
  setApiKeys: (items: ApiKeyResponse[]) => void;
  setLoading: (val: boolean) => void;
  setError: (msg: string | null) => void;
  selectIntegration: (item: IntegrationConfig | null) => void;
  setGeneratedKey: (key: string | null) => void;
  addIntegration: (item: IntegrationConfig) => void;
  updateIntegration: (id: string, item: Partial<IntegrationConfig>) => void;
  removeIntegration: (id: string) => void;
  addApiKey: (item: ApiKeyResponse) => void;
  removeApiKey: (id: string) => void;
}

export const useIntegrationStore = create<IntegrationState>((set) => ({
  integrations: [],
  statusMap: [],
  apiKeys: [],
  isLoading: false,
  error: null,
  selectedIntegration: null,
  generatedKey: null,

  setIntegrations: (items) => set({ integrations: items }),
  setStatusMap: (items) => set({ statusMap: items }),
  setApiKeys: (items) => set({ apiKeys: items }),
  setLoading: (val) => set({ isLoading: val }),
  setError: (msg) => set({ error: msg }),
  selectIntegration: (item) => set({ selectedIntegration: item }),
  setGeneratedKey: (key) => set({ generatedKey: key }),

  addIntegration: (item) =>
    set((state) => ({ integrations: [item, ...state.integrations] })),

  updateIntegration: (id, patch) =>
    set((state) => ({
      integrations: state.integrations.map((i) =>
        i.id === id ? { ...i, ...patch } : i
      ),
    })),

  removeIntegration: (id) =>
    set((state) => ({
      integrations: state.integrations.filter((i) => i.id !== id),
    })),

  addApiKey: (item) =>
    set((state) => ({ apiKeys: [item, ...state.apiKeys] })),

  removeApiKey: (id) =>
    set((state) => ({
      apiKeys: state.apiKeys.filter((k) => k.id !== id),
    })),
}));
