/**
 * M17 Reporting — Report API Calls
 * Owner: D4-DELTA
 */
import apiClient from '../../../shared/api-client';
import {
  ReportType,
  ReportFilters,
  ExportFormat,
  ReportResponse,
  SalesReportData,
  PurchaseReportData,
  InventoryReportData,
  GSTReportData,
  AccountingReportData,
  HRReportData,
  ExecutiveDashboard,
  ExportReportRequest,
  ExportReportResponse,
} from './report.types';

const BASE_URL = '/api/v1/reports';

export const reportService = {
  // ─── Generate Report ───
  async generateReport<T>(
    reportType: ReportType,
    filters: ReportFilters,
    format?: ExportFormat
  ): Promise<ReportResponse<T>> {
    const response = await apiClient.post<ReportResponse<T>>(`${BASE_URL}/generate`, {
      reportType,
      filters,
      format,
    });
    return response.data;
  },

  // ─── Specific Report APIs ───
  async getSalesReport(filters: ReportFilters): Promise<ReportResponse<SalesReportData>> {
    const response = await apiClient.get<ReportResponse<SalesReportData>>(`${BASE_URL}/sales`, {
      params: filters,
    });
    return response.data;
  },

  async getPurchaseReport(filters: ReportFilters): Promise<ReportResponse<PurchaseReportData>> {
    const response = await apiClient.get<ReportResponse<PurchaseReportData>>(`${BASE_URL}/purchase`, {
      params: filters,
    });
    return response.data;
  },

  async getInventoryReport(filters: ReportFilters): Promise<ReportResponse<InventoryReportData>> {
    const response = await apiClient.get<ReportResponse<InventoryReportData>>(`${BASE_URL}/inventory`, {
      params: filters,
    });
    return response.data;
  },

  async getGSTReport(filters: ReportFilters): Promise<ReportResponse<GSTReportData>> {
    const response = await apiClient.get<ReportResponse<GSTReportData>>(`${BASE_URL}/gst`, {
      params: filters,
    });
    return response.data;
  },

  async getAccountingReport(filters: ReportFilters): Promise<ReportResponse<AccountingReportData>> {
    const response = await apiClient.get<ReportResponse<AccountingReportData>>(`${BASE_URL}/accounting`, {
      params: filters,
    });
    return response.data;
  },

  async getHRReport(filters: ReportFilters): Promise<ReportResponse<HRReportData>> {
    const response = await apiClient.get<ReportResponse<HRReportData>>(`${BASE_URL}/hr`, {
      params: filters,
    });
    return response.data;
  },

  // ─── Export ───
  async exportReport(request: ExportReportRequest): Promise<ExportReportResponse> {
    const response = await apiClient.post<ExportReportResponse>(`${BASE_URL}/export`, request);
    return response.data;
  },

  // ─── Executive Dashboard ───
  async getExecutiveDashboard(): Promise<ReportResponse<ExecutiveDashboard>> {
    const response = await apiClient.get<ReportResponse<ExecutiveDashboard>>(`${BASE_URL}/executive`);
    return response.data;
  },

  // ─── Config Management ───
  async getConfigs() {
    const response = await apiClient.get(`${BASE_URL}/configs`);
    return response.data;
  },

  async createConfig(data: Record<string, unknown>) {
    const response = await apiClient.post(`${BASE_URL}/configs`, data);
    return response.data;
  },

  async updateConfig(id: string, data: Record<string, unknown>) {
    const response = await apiClient.put(`${BASE_URL}/configs/${id}`, data);
    return response.data;
  },

  async deleteConfig(id: string) {
    await apiClient.delete(`${BASE_URL}/configs/${id}`);
  },

  // ─── Template Management ───
  async getTemplates() {
    const response = await apiClient.get(`${BASE_URL}/templates`);
    return response.data;
  },

  async createTemplate(data: Record<string, unknown>) {
    const response = await apiClient.post(`${BASE_URL}/templates`, data);
    return response.data;
  },

  async updateTemplate(id: string, data: Record<string, unknown>) {
    const response = await apiClient.put(`${BASE_URL}/templates/${id}`, data);
    return response.data;
  },

  async deleteTemplate(id: string) {
    await apiClient.delete(`${BASE_URL}/templates/${id}`);
  },
};
