const API_BASE = '/api/m15';

const headers = () => ({
  'Content-Type': 'application/json',
  'x-tenant-id': localStorage.getItem('tenantId') || 'tenant-default',
  'x-user-id': localStorage.getItem('userId') || 'system',
  'x-user-role': localStorage.getItem('userRole') || 'admin'
});

const handleResponse = async (res: Response) => {
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'API Error');
  return data.data;
};

export const SyncAPI = {
  // Configs
  getConfigs: (filters?: { sourceSystem?: string; status?: string }) =>
    fetch(`${API_BASE}/sync/configs?${new URLSearchParams(filters as any)}`, { headers: headers() }).then(handleResponse),

  getConfig: (id: string) =>
    fetch(`${API_BASE}/sync/configs/${id}`, { headers: headers() }).then(handleResponse),

  createConfig: (data: any) =>
    fetch(`${API_BASE}/sync/configs`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),

  updateConfig: (id: string, data: any) =>
    fetch(`${API_BASE}/sync/configs/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),

  deleteConfig: (id: string) =>
    fetch(`${API_BASE}/sync/configs/${id}`, { method: 'DELETE', headers: headers() }).then(handleResponse),

  // Jobs
  triggerSync: (data: any) =>
    fetch(`${API_BASE}/sync/trigger`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),

  getJobs: (filters?: any) =>
    fetch(`${API_BASE}/sync/jobs?${new URLSearchParams(filters)}`, { headers: headers() }).then(handleResponse),

  getJob: (jobId: string) =>
    fetch(`${API_BASE}/sync/jobs/${jobId}`, { headers: headers() }).then(handleResponse),

  getJobProgress: (jobId: string) =>
    fetch(`${API_BASE}/sync/jobs/${jobId}/progress`, { headers: headers() }).then(handleResponse),

  cancelJob: (jobId: string) =>
    fetch(`${API_BASE}/sync/jobs/${jobId}/cancel`, { method: 'POST', headers: headers() }).then(handleResponse),

  previewSync: (configId: string) =>
    fetch(`${API_BASE}/sync/preview/${configId}`, { headers: headers() }).then(handleResponse),

  // Conflicts
  getConflicts: (filters?: any) =>
    fetch(`${API_BASE}/conflicts?${new URLSearchParams(filters)}`, { headers: headers() }).then(handleResponse),

  getConflictStats: () =>
    fetch(`${API_BASE}/conflicts/stats`, { headers: headers() }).then(handleResponse),

  resolveConflict: (conflictId: string, resolution: string, resolvedBy: string, mergedValue?: any) =>
    fetch(`${API_BASE}/conflicts/${conflictId}/resolve`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ conflictId, resolution, resolvedBy, mergedValue })
    }).then(handleResponse),

  bulkResolve: (conflictIds: string[], resolution: string, resolvedBy: string) =>
    fetch(`${API_BASE}/conflicts/bulk-resolve`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ conflictIds, resolution, resolvedBy })
    }).then(handleResponse),

  autoResolve: (jobId: string) =>
    fetch(`${API_BASE}/conflicts/auto-resolve/${jobId}`, { method: 'POST', headers: headers() }).then(handleResponse),

  // Backups
  getBackups: () =>
    fetch(`${API_BASE}/backups`, { headers: headers() }).then(handleResponse),

  createBackup: (data: any) =>
    fetch(`${API_BASE}/backups`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),

  deleteBackup: (id: string) =>
    fetch(`${API_BASE}/backups/${id}`, { method: 'DELETE', headers: headers() }).then(handleResponse),

  downloadBackup: (id: string) =>
    `${API_BASE}/backups/${id}/download`,

  // Integrations
  getIntegrations: () =>
    fetch(`${API_BASE}/integrations`, { headers: headers() }).then(handleResponse),

  createIntegration: (data: any) =>
    fetch(`${API_BASE}/integrations`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),

  updateIntegration: (id: string, data: any) =>
    fetch(`${API_BASE}/integrations/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),

  deleteIntegration: (id: string) =>
    fetch(`${API_BASE}/integrations/${id}`, { method: 'DELETE', headers: headers() }).then(handleResponse),

  healthCheck: (id: string) =>
    fetch(`${API_BASE}/integrations/${id}/health`, { headers: headers() }).then(handleResponse),

  healthCheckAll: () =>
    fetch(`${API_BASE}/integrations/health/all`, { headers: headers() }).then(handleResponse)
};
