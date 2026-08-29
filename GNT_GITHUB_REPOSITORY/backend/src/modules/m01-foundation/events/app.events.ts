export const APP_EVENTS = {
  HEALTH_DEGRADED: "system.health.degraded",
  HEALTH_RESTORED: "system.health.restored",
  MAINTENANCE_TOGGLED: "system.maintenance.toggled",
} as const;

export type AppEventName = (typeof APP_EVENTS)[keyof typeof APP_EVENTS];
