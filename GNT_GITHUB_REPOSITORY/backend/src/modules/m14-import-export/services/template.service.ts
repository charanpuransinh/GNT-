// M14 — Template Service
// Lock: LOCK_05_TEMPLATE
import { PrismaClient } from '@prisma/client';
import { ColumnMapping } from '../types';

const prisma = new PrismaClient();

export class TemplateService {
  async createTemplate(data: {
    tenantId: string; name: string; module: string; entityType: string;
    fileType: string; columnMapping: ColumnMapping[]; sampleFileUrl?: string;
    isDefault?: boolean; userId: string;
  }) {
    if (data.isDefault) {
      await prisma.importMapping.updateMany({
        where: { tenantId: data.tenantId, module: data.module, entityType: data.entityType, isDefault: true },
        data: { isDefault: false }
      });
    }
    return prisma.importMapping.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        module: data.module,
        entityType: data.entityType,
        fileType: data.fileType,
        columnMapping: data.columnMapping as any,
        sampleFileUrl: data.sampleFileUrl,
        isDefault: data.isDefault ?? false,
        createdBy: data.userId,
      }
    });
  }

  async getTemplates(tenantId: string, module?: string, entityType?: string) {
    return prisma.importMapping.findMany({
      where: { tenantId, ...(module && { module }), ...(entityType && { entityType }) },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTemplateById(id: string, tenantId: string) {
    const t = await prisma.importMapping.findFirst({ where: { id, tenantId } });
    if (!t) throw new Error('Template not found');
    return t;
  }

  async getDefaultTemplate(tenantId: string, module: string, entityType: string) {
    return prisma.importMapping.findFirst({
      where: { tenantId, module, entityType, isDefault: true }
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
        where: { tenantId: data.tenantId, module: data.module, entityType: data.entityType, isDefault: true },
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
}
