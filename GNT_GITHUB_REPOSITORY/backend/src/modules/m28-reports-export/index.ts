/**
 * M28 — Reports & Export
 * index.ts — Public M28 exports.
 *
 * Communication pieces (EmailDispatcher, EmailSmsService,
 * CommunicationLogService) and ReportTemplateService from the original
 * blueprint are intentionally NOT exported — see M28_INTEGRATION_NOTES.md.
 */

export { ReportBuilder, reportBuilder, type ReportSpec, type BuiltReport, type ReportDataProvider } from './reports/report-builder';
export { ReportExportService, reportExportService, type ExportFormat, type ExportRenderer, type ExportedFile } from './reports/report-export.service';
export { ExportScheduler, type ReportScheduleRequest, type SchedulerPort } from './scheduler/export-scheduler';
