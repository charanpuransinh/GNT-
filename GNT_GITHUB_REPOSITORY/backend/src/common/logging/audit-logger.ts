export interface AuditEntry { action: string; target?: string; [key: string]: unknown }
export class AuditLogger {
  log(entry: AuditEntry): void { console.info(JSON.stringify({ type: 'audit', ...entry, timestamp: new Date().toISOString() })); }
}
export const auditLogger = new AuditLogger();
