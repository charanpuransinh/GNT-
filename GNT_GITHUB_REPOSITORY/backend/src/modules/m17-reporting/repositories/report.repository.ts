/**
 * M17 Reporting — Repository
 * Owner: D4-DELTA
 * Tables: report_config, report_template
 */
import { PrismaClient, Prisma } from '@prisma/client';
import {
  ReportConfig,
  ReportTemplate,
} from '../types/report.types';

export class ReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── Report Config CRUD ───

  async createConfig(
    data: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string }
  ): Promise<ReportConfig> {
    return this.prisma.reportConfig.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        reportType: data.reportType,
        filtersJson: data.filtersJson as Prisma.InputJsonValue,
        schedule: data.schedule ? (JSON.parse(JSON.stringify(data.schedule)) as Prisma.InputJsonValue) : undefined,
        createdBy: data.createdBy,
      },
    }) as Promise<ReportConfig>;
  }

  async findConfigById(id: string, companyId: string): Promise<ReportConfig | null> {
    return this.prisma.reportConfig.findFirst({
      where: { id, companyId },
    }) as Promise<ReportConfig | null>;
  }

  async findConfigsByCompany(companyId: string): Promise<ReportConfig[]> {
    return this.prisma.reportConfig.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    }) as Promise<ReportConfig[]>;
  }

  async findConfigsByType(companyId: string, reportType: string): Promise<ReportConfig[]> {
    return this.prisma.reportConfig.findMany({
      where: { companyId, reportType },
      orderBy: { createdAt: 'desc' },
    }) as Promise<ReportConfig[]>;
  }

  async updateConfig(
    id: string,
    companyId: string,
    data: Partial<ReportConfig>
  ): Promise<ReportConfig> {
    return this.prisma.reportConfig.update({
      where: { id },
      data: {
        ...data,
        filtersJson: data.filtersJson ? (data.filtersJson as Prisma.InputJsonValue) : undefined,
        schedule: data.schedule ? (JSON.parse(JSON.stringify(data.schedule)) as Prisma.InputJsonValue) : undefined,
      },
    }) as Promise<ReportConfig>;
  }

  async deleteConfig(id: string, companyId: string): Promise<ReportConfig> {
    // Verify ownership before delete
    const config = await this.findConfigById(id, companyId);
    if (!config) throw new Error('Report config not found');
    return this.prisma.reportConfig.delete({
      where: { id },
    }) as Promise<ReportConfig>;
  }

  // ─── Report Template CRUD ───

  async createTemplate(
    data: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string }
  ): Promise<ReportTemplate> {
    return this.prisma.reportTemplate.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        templateType: data.templateType,
        layoutJson: data.layoutJson as Prisma.InputJsonValue,
        headerHtml: data.headerHtml,
        footerHtml: data.footerHtml,
        createdBy: data.createdBy,
      },
    }) as Promise<ReportTemplate>;
  }

  async findTemplateById(id: string, companyId: string): Promise<ReportTemplate | null> {
    return this.prisma.reportTemplate.findFirst({
      where: { id, companyId },
    }) as Promise<ReportTemplate | null>;
  }

  async findTemplatesByCompany(companyId: string): Promise<ReportTemplate[]> {
    return this.prisma.reportTemplate.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
    }) as Promise<ReportTemplate[]>;
  }

  async updateTemplate(
    id: string,
    companyId: string,
    data: Partial<ReportTemplate>
  ): Promise<ReportTemplate> {
    const template = await this.findTemplateById(id, companyId);
    if (!template) throw new Error('Report template not found');
    return this.prisma.reportTemplate.update({
      where: { id },
      data: {
        ...data,
        layoutJson: data.layoutJson ? (data.layoutJson as Prisma.InputJsonValue) : undefined,
      },
    }) as Promise<ReportTemplate>;
  }

  async deleteTemplate(id: string, companyId: string): Promise<ReportTemplate> {
    const template = await this.findTemplateById(id, companyId);
    if (!template) throw new Error('Report template not found');
    return this.prisma.reportTemplate.delete({
      where: { id },
    }) as Promise<ReportTemplate>;
  }
}
