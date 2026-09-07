// M14 — Template Service
// Lock: LOCK_05_TEMPLATE
//
// हर public method tenantId माँगती है (optional नहीं) — tenant के बिना template
// पढ़ना/लिखना मना। पहले यहाँ "legacy alias" methods थीं जिनमें tenantId optional
// था और गायब होने पर चुपचाप '' बन जाता था; controller उन्हीं को ग़लत args के साथ
// बुलाता था (update/delete असल में हमेशा "not found" पर गिरते थे)। वह परत हटा दी।
import { prisma } from '@/common/config/prisma';
import { AppError } from '@/common/errors/error-classes';
import { ColumnMapping } from '../types';

export interface CreateTemplateInput {
  tenantId: string;
  name: string;
  targetModule: string;
  targetEntity: string;
  fileType: string;
  columnMapping: ColumnMapping[];
  sampleFileUrl?: string;
  isDefault?: boolean;
  userId: string;
}

export interface UpdateTemplateInput {
  name?: string;
  targetModule?: string;
  targetEntity?: string;
  mappings?: ColumnMapping[];
  isDefault?: boolean;
}

export class TemplateService {
  async createTemplate(data: CreateTemplateInput) {
    if (data.isDefault) {
      await prisma.importMapping.updateMany({
        where: { tenantId: data.tenantId, targetModule: data.targetModule, targetEntity: data.targetEntity, isDefault: true },
        data: { isDefault: false },
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
      },
    });
  }

  async getTemplates(tenantId: string, targetModule?: string, targetEntity?: string) {
    return prisma.importMapping.findMany({
      where: { tenantId, ...(targetModule && { targetModule }), ...(targetEntity && { targetEntity }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplateById(id: string, tenantId: string) {
    const t = await prisma.importMapping.findFirst({ where: { id, tenantId } });
    if (!t) throw new AppError('NOT_FOUND', 'Template not found', 404);
    return t;
  }

  async getDefaultTemplate(tenantId: string, targetModule: string, targetEntity: string) {
    return prisma.importMapping.findFirst({
      where: { tenantId, targetModule, targetEntity, isDefault: true },
    });
  }

  async updateTemplate(id: string, tenantId: string, data: UpdateTemplateInput) {
    await this.getTemplateById(id, tenantId); // tenant-scoped existence check (throws 404)
    if (data.isDefault) {
      const current = await prisma.importMapping.findFirst({ where: { id, tenantId } });
      if (current) {
        await prisma.importMapping.updateMany({
          where: {
            tenantId,
            targetModule: data.targetModule ?? current.targetModule,
            targetEntity: data.targetEntity ?? current.targetEntity,
            isDefault: true,
            NOT: { id },
          },
          data: { isDefault: false },
        });
      }
    }
    return prisma.importMapping.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.targetModule !== undefined && { targetModule: data.targetModule }),
        ...(data.targetEntity !== undefined && { targetEntity: data.targetEntity }),
        ...(data.mappings !== undefined && { mappings: data.mappings as never }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    });
  }

  async deleteTemplate(id: string, tenantId: string) {
    await this.getTemplateById(id, tenantId); // tenant-scoped existence check (throws 404)
    return prisma.importMapping.delete({ where: { id } });
  }

  // ─── Export templates ───
  async createExportTemplate(data: {
    tenantId: string;
    name: string;
    sourceModule?: string;
    sourceEntity?: string;
    targetModule?: string;
    targetEntity?: string;
    isDefault?: boolean;
    userId: string;
    [k: string]: unknown;
  }) {
    if (data.isDefault) {
      await prisma.exportTemplate.updateMany({
        where: {
          tenantId: data.tenantId,
          sourceModule: data.sourceModule ?? data.targetModule,
          sourceEntity: data.sourceEntity ?? data.targetEntity,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }
    return prisma.exportTemplate.create({ data: { ...data, createdBy: data.userId } as never });
  }

  async getExportTemplates(tenantId: string, module?: string, entityType?: string) {
    return prisma.exportTemplate.findMany({
      where: { tenantId, ...(module && { module }), ...(entityType && { entityType }) },
    });
  }
}
