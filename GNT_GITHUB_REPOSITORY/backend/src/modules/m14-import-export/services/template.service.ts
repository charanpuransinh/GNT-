// M14 — Template Service
// Lock: LOCK_05_TEMPLATE
import { PrismaClient } from '@prisma/client';
import { ColumnMapping } from '../types';

const prisma = new PrismaClient();

export class TemplateService {
  async createTemplate(data: {
    tenantId: string; name: string; targetModule: string; targetEntity: string;
    fileType: string; columnMapping: ColumnMapping[]; sampleFileUrl?: string;
    isDefault?: boolean; userId: string;
  }) {
    if (data.isDefault) {
      await prisma.importMapping.updateMany({
        where: { tenantId: data.tenantId, targetModule: data.targetModule, targetEntity: data.targetEntity, isDefault: true },
        data: { isDefault: false }
      });
    }
    return prisma.importMapping.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        targetModule: data.targetModule,
        targetEntity: data.targetEntity,
        mappings: data.columnMapping as never,
        validationRules: [] as never,
        isDefault: data.isDefault ?? false,
      }
    });
  }

  async getTemplates(tenantId: string, module?: string, entityType?: string) {
    return prisma.importMapping.findMany({
      where: { tenantId, ...(module && { targetModule: module }), ...(entityType && { targetEntity: entityType }) },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTemplateById(id: string, tenantId: string) {
    const t = await prisma.importMapping.findFirst({ where: { id, tenantId } });
    if (!t) throw new Error('Template not found');
    return t;
  }

  async getDefaultTemplate(tenantId: string, targetModule: string, targetEntity: string) {
    return prisma.importMapping.findFirst({
      where: { tenantId, targetModule, targetEntity, isDefault: true }
    });
  }

  async updateTemplate(id: string, tenantId: string, data: Partial<any>) {
    await this.getTemplateById(id, tenantId);
    return prisma.importMapping.update({ where: { id }, data });
  }

  async deleteTemplate(id: string, tenantId: string) {
    await this.getTemplateById(id, tenantId);
    return prisma.importMapping.delete({ where: { id } });
  }

  // Export templates
  async createExportTemplate(data: any) {
    if (data.isDefault) {
      await prisma.exportTemplate.updateMany({
        where: { tenantId: data.tenantId, sourceModule: data.sourceModule ?? data.targetModule, sourceEntity: data.sourceEntity ?? data.targetEntity, isDefault: true },
        data: { isDefault: false }
      });
    }
    return prisma.exportTemplate.create({
      data: { ...data, createdBy: data.userId }
    });
  }

  async getExportTemplates(tenantId: string, module?: string, entityType?: string) {
    return prisma.exportTemplate.findMany({
      where: { tenantId, ...(module && { module }), ...(entityType && { entityType }) }
    });
  }

  // ─── Legacy alias (टास्क #025 B2): पुराना template.controller यही नाम बुलाता है ───
  async create(data: Parameters<TemplateService['createTemplate']>[0]) {
    return this.createTemplate(data);
  }
  async update(id: string, tenantId?: string, data?: unknown) {
    return this.updateTemplate(id, String(tenantId ?? ''), data as Parameters<TemplateService['updateTemplate']>[2]);
  }
  async delete(id: string, tenantId?: string) {
    return this.deleteTemplate(id, String(tenantId ?? ''));
  }
  async getById(id: string, tenantId?: string) {
    return this.getTemplateById(id, String(tenantId ?? ''));
  }
  async list(tenantId?: string, module?: string, entityType?: string) {
    return this.getTemplates(String(tenantId ?? ''), module, entityType);
  }
  async getDefault(tenantId?: string, module?: string, entityType?: string) {
    return this.getDefaultTemplate(String(tenantId ?? ''), String(module ?? ''), String(entityType ?? ''));
  }
}
