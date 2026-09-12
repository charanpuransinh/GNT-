export const WEBSOCKET_CONFIG = {
  library: 'socket.io',
  namespace: '/realtime',
  rooms: {
    tenant: 'tenant:{tenantId}',
    user: 'user:{userId}',
    scope: 'scope:{scopeId}',
  },
  authenticationRequired: true,
  tenantIsolationRequired: true,
  permissionCheckRequired: true,
  scopeCheckRequired: true,
} as const;

export const REALTIME_EVENTS = [
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
