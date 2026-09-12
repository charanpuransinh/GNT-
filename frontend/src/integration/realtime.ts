export interface RealtimeConfig {
  namespace: string;
  events: readonly string[];
}

export const REALTIME_CONFIG: RealtimeConfig = {
  namespace: '/realtime',
  events: [
    'notification.created',
    'notification.updated',
    'notification.read',
    'event.published',
    'dashboard.updated',
    'workflow.updated',
    'approval.requested',
    'approval.updated',
    'sync.updated',
    'ai.alert',
  ],
};

export function getRealtimeNamespace(): string {
  return REALTIME_CONFIG.namespace;
}
