export interface RealtimeClientConfig {
  namespace: string;
  transports: string[];
  withCredentials: boolean;
}

export const GNT_REALTIME_CONFIG: RealtimeClientConfig = {
  namespace: '/realtime',
  transports: ['websocket', 'polling'],
  withCredentials: true,
};

export const GNT_REALTIME_EVENTS = [
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
] as const;
