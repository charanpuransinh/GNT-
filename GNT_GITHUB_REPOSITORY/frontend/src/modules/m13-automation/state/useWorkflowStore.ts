import { create } from 'zustand';
import { api } from '../../../m03-core/src/frontend/api';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: string;
  triggerType: string;
  createdAt: string;
}

interface Execution {
  id: string;
  workflowId: string;
  status: string;
  triggerSource: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  steps?: any[];
}

interface WorkflowState {
  workflows: Workflow[];
  executions: Execution[];
  selectedWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;

  loadWorkflows: (params?: any) => Promise<void>;
  createWorkflow: (data: Partial<Workflow>) => Promise<void>;
  updateWorkflow: (id: string, data: Partial<Workflow>) => Promise<void>;
  executeWorkflow: (id: string, payload?: any) => Promise<void>;
  loadExecutions: (workflowId?: string) => Promise<void>;
  selectWorkflow: (workflow: Workflow | null) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  executions: [],
  selectedWorkflow: null,
  isLoading: false,
  error: null,

  loadWorkflows: async (params = {}) => {
    set({ isLoading: true });
    try {
      const res = await api.get('/automation/workflows', { params });
      set({ workflows: res.data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createWorkflow: async (data) => {
    const res = await api.post('/automation/workflows', data);
    set(state => ({ workflows: [res.data, ...state.workflows] }));
  },

  updateWorkflow: async (id, data) => {
    const res = await api.put(`/automation/workflows/${id}`, data);
    set(state => ({
      workflows: state.workflows.map(w => w.id === id ? res.data : w),
      selectedWorkflow: state.selectedWorkflow?.id === id ? res.data : state.selectedWorkflow
    }));
  },

  executeWorkflow: async (id, payload = {}) => {
    await api.post(`/automation/workflows/${id}/execute`, payload);
    get().loadExecutions(id);
  },

  loadExecutions: async (workflowId) => {
    const params = workflowId ? { workflowId } : {};
    const res = await api.get('/automation/executions', { params });
    set({ executions: res.data.data });
  },

  selectWorkflow: (workflow) => set({ selectedWorkflow: workflow })
}));
