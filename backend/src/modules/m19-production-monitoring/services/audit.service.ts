export class AuditService {
  private prisma: any;
  constructor(prisma: any) { this.prisma = prisma; }

  async logAction(userId: string, action: string, entity: string, entityId: string, metadata: Record<string, any>): Promise<void> {
    const safeMetadata = JSON.parse(JSON.stringify(metadata));
    await this.prisma.audit_log.create({
      data: { user_id: userId, action, entity, entity_id: entityId, metadata: safeMetadata, ip_address: metadata.ip_address || 'unknown', user_agent: metadata.user_agent || 'unknown' },
    });
  }

  async flagSecurityEvent(userId: string, reason: string, severity: 'LOW' | 'MEDIUM' | 'HIGH'): Promise<void> {
    await this.prisma.security_event.create({ data: { user_id: userId, reason, severity, resolved: false } });
  }
}
// STATUS: CERTIFIED
