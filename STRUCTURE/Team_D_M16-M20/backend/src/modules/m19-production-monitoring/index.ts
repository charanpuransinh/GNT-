export { AuditService } from './services/audit.service';
// WIRING FIX (2026-08-28): removed `export { SecurityInternal } from './services/security.internal'` —
// class name itself says Internal and it's not meant to leave M19. Same pattern as M17's report.internal.
export { HealthService } from './services/health.service';
export { AuditRepository } from './repositories/audit.repository';
export { SecurityRepository } from './repositories/security.repository';
export { securityRoutes } from './routes/security.routes';
export { SecurityEventHandlers } from './events/security.handlers';
export * from './types/security.types';
export * from './events/security.events';
