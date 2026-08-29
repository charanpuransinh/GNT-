/**
 * M17 Reporting — PUBLIC Business Logic
 * Owner: D4-DELTA
 * Exposed to: Frontend pages, Executive BI widget
 */
import { ReportRepository } from '../repositories/report.repository';
import { ReportQueryBuilder } from './report.internal';
import { ReportGenerator } from './report.generator';
import {
  GenerateReportRequestDto,
  ExportReportRequestDto,
  ReportConfigDto,
  ReportTemplateDto,
  ReportResponse,
  ExportReportResponse,
  ReportType,
  ReportFilters,
  ExecutiveDashboard,
  ReportConfig,
  ReportTemplate,
} from '../types/report.types';

export class ReportService {
  private readonly queryBuilder: ReportQueryBuilder;
  private readonly generator: ReportGenerator;

  constructor(
    private readonly repository: ReportRepository,
    inventoryService: Parameters<typeof ReportQueryBuilder.prototype.constructor>[0],
    purchaseService: Parameters<typeof ReportQueryBuilder.prototype.constructor>[1],
    salesService: Parameters<typeof ReportQueryBuilder.prototype.constructor>[2],
    gstService: Parameters<typeof ReportQueryBuilder.prototype.constructor>[3],
    accountingService: Parameters<typeof ReportQueryBuilder.prototype.constructor>[4],
    hrService: Parameters<typeof ReportQueryBuilder.prototype.constructor>[5],
    exportDir?: string
  ) {
    this.queryBuilder = new ReportQueryBuilder(
      inventoryService,
      purchaseService,
      salesService,
      gstService,
      accountingService,
      hrService
    );
    this.generator = new ReportGenerator(exportDir);
  }

  /**
   * PUBLIC: Generate report data
   * → Frontend pages
   */
  async generateReport(
    request: GenerateReportRequestDto,
    companyId: string
  ): Promise<ReportResponse<unknown>> {
    const { reportType, filters } = request;

    // Build report via query builder (cross-module READ ONLY calls)
    const data = await this.queryBuilder.buildReport(reportType, filters);

    // Calculate row count based on report type
    let rowCount = 0;
    if (Array.isArray(data)) {
      rowCount = data.length;
    } else if (typeof data === 'object' && data !== null) {
      const d = data as Record<string, unknown>;
      if (Array.isArray(d.rows)) rowCount = d.rows.length;
      else if (Array.isArray(d.data)) rowCount = d.data.length;
      else if (Array.isArray(d.attendance)) rowCount = d.attendance.length;
    }

    return {
      success: true,
      data,
      meta: {
        generatedAt: new Date().toISOString(),
        rowCount,
        reportType,
        filters: filters as ReportFilters,
      },
    };
  }

  /**
   * PUBLIC: Export report as PDF/Excel
   * → PDF/Excel download
   */
  async exportReport(
    request: ExportReportRequestDto,
    companyId: string,
    baseUrl: string
  ): Promise<ExportReportResponse> {
    const { reportType, format, data, templateId, fileName } = request;

    // Fetch template if specified
    let template: ReportTemplate | null = null;
    if (templateId) {
      template = await this.repository.findTemplateById(templateId, companyId);
    }

    // Generate file
    const result = await this.generator.generate(reportType, format, data, template);

    // Construct download URL (in production, this would be a signed URL)
    const downloadUrl = `${baseUrl}/downloads/${result.fileName}`;

    return {
      success: true,
      downloadUrl,
      fileName: fileName || result.fileName,
      fileSize: result.fileSize,
    };
  }

  /**
   * PUBLIC: Get Executive Dashboard
   * → Executive BI widget
   */
  async getExecutiveDashboard(companyId: string): Promise<ReportResponse<ExecutiveDashboard>> {
    const data = await this.queryBuilder.buildReport('executive', {}) as ExecutiveDashboard;

    return {
      success: true,
      data,
      meta: {
        generatedAt: new Date().toISOString(),
        rowCount: 0,
        reportType: 'executive',
        filters: {},
      },
    };
  }

  // ─── Report Config Management ───

  async createReportConfig(
    dto: ReportConfigDto,
    createdBy: string
  ): Promise<ReportConfig> {
    return this.repository.createConfig({ ...dto, createdBy });
  }

  async getReportConfigs(companyId: string): Promise<ReportConfig[]> {
    return this.repository.findConfigsByCompany(companyId);
  }

  async getReportConfigsByType(companyId: string, reportType: ReportType): Promise<ReportConfig[]> {
    return this.repository.findConfigsByType(companyId, reportType);
  }

  async updateReportConfig(
    id: string,
    companyId: string,
    dto: Partial<ReportConfigDto>
  ): Promise<ReportConfig> {
    return this.repository.updateConfig(id, companyId, dto);
  }

  async deleteReportConfig(id: string, companyId: string): Promise<ReportConfig> {
    return this.repository.deleteConfig(id, companyId);
  }

  // ─── Report Template Management ───

  async createReportTemplate(
    dto: ReportTemplateDto,
    createdBy: string
  ): Promise<ReportTemplate> {
    return this.repository.createTemplate({ ...dto, createdBy });
  }

  async getReportTemplates(companyId: string): Promise<ReportTemplate[]> {
    return this.repository.findTemplatesByCompany(companyId);
  }

  async updateReportTemplate(
    id: string,
    companyId: string,
    dto: Partial<ReportTemplateDto>
  ): Promise<ReportTemplate> {
    return this.repository.updateTemplate(id, companyId, dto);
  }

  async deleteReportTemplate(id: string, companyId: string): Promise<ReportTemplate> {
    return this.repository.deleteTemplate(id, companyId);
  }
}
