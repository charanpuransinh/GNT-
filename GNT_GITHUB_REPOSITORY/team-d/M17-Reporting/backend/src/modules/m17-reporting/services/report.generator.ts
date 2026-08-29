/**
 * M17 Reporting — PDF/Excel Generation Engine
 * Owner: D4-DELTA
 */
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  ExportFormat,
  ReportType,
  SalesReportData,
  PurchaseReportData,
  InventoryReportData,
  GSTReportData,
  AccountingReportData,
  HRReportData,
  ReportTemplate,
} from '../types/report.types';

export class ReportGenerator {
  private readonly exportDir: string;

  constructor(exportDir = '/tmp/exports') {
    this.exportDir = exportDir;
  }

  async generate(
    reportType: ReportType,
    format: ExportFormat,
    data: unknown,
    template?: ReportTemplate | null
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    await mkdir(this.exportDir, { recursive: true });
    const id = uuidv4();

    switch (format) {
      case 'pdf':
        return this.generatePDF(reportType, data as Record<string, unknown>, id, template);
      case 'excel':
        return this.generateExcel(reportType, data as Record<string, unknown>, id, template);
      case 'csv':
        return this.generateCSV(reportType, data as Record<string, unknown>, id);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private async generatePDF(
    reportType: ReportType,
    data: Record<string, unknown>,
    id: string,
    template?: ReportTemplate | null
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const fileName = `${reportType}-report-${id}.pdf`;
    const filePath = join(this.exportDir, fileName);
    const doc = new PDFDocument({ margin: 50 });
    const stream = createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text(this.getReportTitle(reportType), 50, 50);
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, 50, 80);
    doc.moveDown(2);

    // Custom header from template
    if (template?.headerHtml) {
      doc.fontSize(12).text(template.headerHtml, 50, doc.y);
      doc.moveDown();
    }

    // Content based on report type
    switch (reportType) {
      case 'sales':
        this.renderSalesPDF(doc, data as unknown as SalesReportData);
        break;
      case 'purchase':
        this.renderPurchasePDF(doc, data as unknown as PurchaseReportData);
        break;
      case 'inventory':
        this.renderInventoryPDF(doc, data as unknown as InventoryReportData);
        break;
      case 'gst':
        this.renderGSTPDF(doc, data as unknown as GSTReportData);
        break;
      case 'accounting':
        this.renderAccountingPDF(doc, data as unknown as AccountingReportData);
        break;
      case 'hr':
        this.renderHRPDF(doc, data as unknown as HRReportData);
        break;
      default:
        doc.text(JSON.stringify(data, null, 2));
    }

    // Footer
    if (template?.footerHtml) {
      doc.moveDown();
      doc.fontSize(10).text(template.footerHtml, 50, doc.y);
    }

    doc.end();
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const stats = await import('fs/promises').then(fs => fs.stat(filePath));
    return { filePath, fileName, fileSize: stats.size };
  }

  private renderSalesPDF(doc: PDFKit.PDFDocument, data: SalesReportData): void {
    // Summary
    doc.fontSize(14).text('Summary', 50, doc.y);
    doc.fontSize(10);
    doc.text(`Total Invoices: ${data.summary.totalInvoices}`);
    doc.text(`Total Revenue: ₹${data.summary.totalRevenue.toLocaleString('en-IN')}`);
    doc.text(`Total Tax: ₹${data.summary.totalTax.toLocaleString('en-IN')}`);
    doc.text(`Avg Margin: ${data.summary.avgMargin}%`);
    doc.moveDown(2);

    // Table header
    doc.fontSize(12).text('Details', 50, doc.y);
    const tableTop = doc.y + 10;
    doc.fontSize(9);
    const cols = [50, 120, 200, 280, 340, 400, 460, 520];
    const headers = ['Date', 'Customer', 'Product', 'Qty', 'Price', 'Tax', 'Total'];
    headers.forEach((h, i) => doc.text(h, cols[i], tableTop));
    doc.moveDown();

    // Rows
    let y = doc.y;
    data.rows.forEach(row => {
      if (y > 700) { doc.addPage(); y = 50; }
      doc.text(row.invoiceDate.slice(0, 10), cols[0], y);
      doc.text(row.customerName.slice(0, 15), cols[1], y);
      doc.text(row.productName.slice(0, 15), cols[2], y);
      doc.text(row.quantity.toString(), cols[3], y);
      doc.text(row.unitPrice.toFixed(2), cols[4], y);
      doc.text(row.totalTax.toFixed(2), cols[5], y);
      doc.text(row.totalAmount.toFixed(2), cols[6], y);
      y += 15;
    });
  }

  private renderPurchasePDF(doc: PDFKit.PDFDocument, data: PurchaseReportData): void {
    doc.fontSize(14).text('Purchase Summary', 50, doc.y);
    doc.fontSize(10);
    doc.text(`Total POs: ${data.summary.totalPOs}`);
    doc.text(`Total Amount: ₹${data.summary.totalAmount.toLocaleString('en-IN')}`);
    doc.moveDown(2);

    const cols = [50, 120, 200, 280, 340, 400, 460];
    const headers = ['Date', 'Supplier', 'Product', 'Qty', 'Rate', 'Amount', 'Status'];
    let y = doc.y;
    headers.forEach((h, i) => doc.text(h, cols[i], y));
    y += 15;
    data.rows.forEach(row => {
      if (y > 700) { doc.addPage(); y = 50; }
      doc.text(row.poDate.slice(0, 10), cols[0], y);
      doc.text(row.supplierName.slice(0, 15), cols[1], y);
      doc.text(row.productName.slice(0, 15), cols[2], y);
      doc.text(row.quantity.toString(), cols[3], y);
      doc.text(row.rate.toFixed(2), cols[4], y);
      doc.text(row.amount.toFixed(2), cols[5], y);
      doc.text(row.status, cols[6], y);
      y += 15;
    });
  }

  private renderInventoryPDF(doc: PDFKit.PDFDocument, data: InventoryReportData): void {
    doc.fontSize(14).text('Inventory Valuation', 50, doc.y);
    doc.fontSize(10);
    doc.text(`Total Items: ${data.valuation.totalItems}`);
    doc.text(`Stock Value: ₹${data.valuation.totalStockValue.toLocaleString('en-IN')}`);
    doc.text(`Low Stock: ${data.valuation.lowStockCount} | Over Stock: ${data.valuation.overStockCount}`);
    doc.moveDown(2);

    const cols = [50, 120, 200, 270, 330, 390, 450, 510];
    const headers = ['SKU', 'Product', 'Opening', 'Inward', 'Outward', 'Closing', 'Value', 'Status'];
    let y = doc.y;
    headers.forEach((h, i) => doc.text(h, cols[i], y));
    y += 15;
    data.rows.forEach(row => {
      if (y > 700) { doc.addPage(); y = 50; }
      doc.text(row.sku.slice(0, 12), cols[0], y);
      doc.text(row.productName.slice(0, 12), cols[1], y);
      doc.text(row.openingStock.toString(), cols[2], y);
      doc.text(row.inwardQty.toString(), cols[3], y);
      doc.text(row.outwardQty.toString(), cols[4], y);
      doc.text(row.closingStock.toString(), cols[5], y);
      doc.text(row.stockValue.toFixed(2), cols[6], y);
      doc.text(row.stockStatus.toUpperCase(), cols[7], y);
      y += 15;
    });
  }

  private renderGSTPDF(doc: PDFKit.PDFDocument, data: GSTReportData): void {
    doc.fontSize(14).text('GST Tax Liability', 50, doc.y);
    doc.fontSize(10);
    doc.text(`Total Taxable: ₹${data.summary.totalTaxable.toLocaleString('en-IN')}`);
    doc.text(`CGST: ₹${data.summary.totalCGST.toLocaleString('en-IN')} | SGST: ₹${data.summary.totalSGST.toLocaleString('en-IN')} | IGST: ₹${data.summary.totalIGST.toLocaleString('en-IN')}`);
    doc.moveDown(2);

    const cols = [50, 120, 200, 280, 340, 400, 460, 520];
    const headers = ['Date', 'GSTIN', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Value'];
    let y = doc.y;
    headers.forEach((h, i) => doc.text(h, cols[i], y));
    y += 15;
    data.rows.forEach(row => {
      if (y > 700) { doc.addPage(); y = 50; }
      doc.text(row.invoiceDate.slice(0, 10), cols[0], y);
      doc.text(row.gstin.slice(0, 15), cols[1], y);
      doc.text(row.taxableValue.toFixed(2), cols[2], y);
      doc.text(row.cgstAmount.toFixed(2), cols[3], y);
      doc.text(row.sgstAmount.toFixed(2), cols[4], y);
      doc.text(row.igstAmount.toFixed(2), cols[5], y);
      doc.text(row.totalTax.toFixed(2), cols[6], y);
      doc.text(row.invoiceValue.toFixed(2), cols[7], y);
      y += 15;
    });
  }

  private renderAccountingPDF(doc: PDFKit.PDFDocument, data: AccountingReportData): void {
    doc.fontSize(14).text('Day Book / Ledger', 50, doc.y);
    doc.fontSize(10);
    doc.text(`Opening: ₹${data.cashflow.openingBalance.toLocaleString('en-IN')} | Closing: ₹${data.cashflow.closingBalance.toLocaleString('en-IN')}`);
    doc.moveDown(2);

    const cols = [50, 120, 200, 280, 340, 400, 460];
    const headers = ['Date', 'Ledger', 'Voucher', 'V.No', 'Debit', 'Credit', 'Narration'];
    let y = doc.y;
    headers.forEach((h, i) => doc.text(h, cols[i], y));
    y += 15;
    data.rows.forEach(row => {
      if (y > 700) { doc.addPage(); y = 50; }
      doc.text(row.date.slice(0, 10), cols[0], y);
      doc.text(row.ledgerName.slice(0, 12), cols[1], y);
      doc.text(row.voucherType, cols[2], y);
      doc.text(row.voucherNo, cols[3], y);
      doc.text(row.debit.toFixed(2), cols[4], y);
      doc.text(row.credit.toFixed(2), cols[5], y);
      doc.text(row.narration.slice(0, 20), cols[6], y);
      y += 15;
    });
  }

  private renderHRPDF(doc: PDFKit.PDFDocument, data: HRReportData): void {
    doc.fontSize(14).text('HR Reports', 50, doc.y);
    doc.fontSize(10);
    doc.text(`Total Employees: ${data.summary.totalEmployees} | Total Payroll: ₹${data.summary.totalPayroll.toLocaleString('en-IN')}`);
    doc.moveDown();

    doc.fontSize(12).text('Attendance', 50, doc.y);
    let y = doc.y + 10;
    doc.fontSize(9);
    const attCols = [50, 140, 220, 280, 330, 380, 430, 480, 530];
    ['Name', 'Dept', 'Month', 'Present', 'Absent', 'Leave', 'Half', 'OT'];
    data.attendance.forEach(row => {
      if (y > 700) { doc.addPage(); y = 50; }
      doc.text(row.employeeName.slice(0, 15), attCols[0], y);
      doc.text(row.department, attCols[1], y);
      doc.text(row.month, attCols[2], y);
      doc.text(row.presentDays.toString(), attCols[3], y);
      doc.text(row.absentDays.toString(), attCols[4], y);
      doc.text(row.leaveDays.toString(), attCols[5], y);
      doc.text(row.halfDays.toString(), attCols[6], y);
      doc.text(row.overtimeHours.toString(), attCols[7], y);
      y += 15;
    });

    doc.moveDown(2);
    doc.fontSize(12).text('Salary Register', 50, doc.y);
    y = doc.y + 10;
    doc.fontSize(9);
    const salCols = [50, 140, 200, 260, 320, 380, 440, 500];
    ['Name', 'Basic', 'HRA', 'DA', 'Gross', 'PF', 'TDS', 'Net'];
    data.salary.forEach(row => {
      if (y > 700) { doc.addPage(); y = 50; }
      doc.text(row.employeeName.slice(0, 15), salCols[0], y);
      doc.text(row.basicSalary.toFixed(0), salCols[1], y);
      doc.text(row.hra.toFixed(0), salCols[2], y);
      doc.text(row.da.toFixed(0), salCols[3], y);
      doc.text(row.grossSalary.toFixed(0), salCols[4], y);
      doc.text(row.pfDeduction.toFixed(0), salCols[5], y);
      doc.text(row.tds.toFixed(0), salCols[6], y);
      doc.text(row.netSalary.toFixed(0), salCols[7], y);
      y += 15;
    });
  }

  private async generateExcel(
    reportType: ReportType,
    data: Record<string, unknown>,
    id: string,
    template?: ReportTemplate | null
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const fileName = `${reportType}-report-${id}.xlsx`;
    const filePath = join(this.exportDir, fileName);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.getReportTitle(reportType));

    // Apply template styles if available
    if (template?.layoutJson) {
      const layout = template.layoutJson as Record<string, unknown>;
      if (layout.columnWidths) {
        (layout.columnWidths as number[]).forEach((width, i) => {
          worksheet.getColumn(i + 1).width = width;
        });
      }
    }

    // Write data based on report type
    switch (reportType) {
      case 'sales':
        this.writeSalesExcel(worksheet, data as unknown as SalesReportData);
        break;
      case 'purchase':
        this.writePurchaseExcel(worksheet, data as unknown as PurchaseReportData);
        break;
      case 'inventory':
        this.writeInventoryExcel(worksheet, data as unknown as InventoryReportData);
        break;
      case 'gst':
        this.writeGSTExcel(worksheet, data as unknown as GSTReportData);
        break;
      case 'accounting':
        this.writeAccountingExcel(worksheet, data as unknown as AccountingReportData);
        break;
      case 'hr':
        this.writeHRExcel(worksheet, data as unknown as HRReportData);
        break;
      default:
        worksheet.addRow(['Data', JSON.stringify(data)]);
    }

    await workbook.xlsx.writeFile(filePath);
    const stats = await import('fs/promises').then(fs => fs.stat(filePath));
    return { filePath, fileName, fileSize: stats.size };
  }

  private writeSalesExcel(ws: ExcelJS.Worksheet, data: SalesReportData): void {
    ws.addRow(['Sales Report']);
    ws.addRow([]);
    ws.addRow(['Summary']);
    ws.addRow(['Total Invoices', data.summary.totalInvoices]);
    ws.addRow(['Total Revenue', data.summary.totalRevenue]);
    ws.addRow(['Total Tax', data.summary.totalTax]);
    ws.addRow(['Avg Margin %', data.summary.avgMargin]);
    ws.addRow([]);
    ws.addRow(['Invoice Date', 'Customer', 'Product', 'Qty', 'Unit Price', 'Gross', 'Discount', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total', 'Margin %']);
    data.rows.forEach(r => {
      ws.addRow([r.invoiceDate, r.customerName, r.productName, r.quantity, r.unitPrice, r.grossAmount, r.discount, r.taxableAmount, r.cgst, r.sgst, r.igst, r.totalAmount, r.marginPercent]);
    });
  }

  private writePurchaseExcel(ws: ExcelJS.Worksheet, data: PurchaseReportData): void {
    ws.addRow(['Purchase Report']);
    ws.addRow([]);
    ws.addRow(['PO Date', 'Supplier', 'Product', 'Qty', 'Rate', 'Amount', 'Received', 'Pending', 'Status']);
    data.rows.forEach(r => {
      ws.addRow([r.poDate, r.supplierName, r.productName, r.quantity, r.rate, r.amount, r.receivedQty, r.pendingQty, r.status]);
    });
  }

  private writeInventoryExcel(ws: ExcelJS.Worksheet, data: InventoryReportData): void {
    ws.addRow(['Inventory Report']);
    ws.addRow([]);
    ws.addRow(['SKU', 'Product', 'Warehouse', 'Opening', 'Inward', 'Outward', 'Closing', 'Unit Cost', 'Stock Value', 'Reorder', 'Status']);
    data.rows.forEach(r => {
      ws.addRow([r.sku, r.productName, r.warehouse, r.openingStock, r.inwardQty, r.outwardQty, r.closingStock, r.unitCost, r.stockValue, r.reorderLevel, r.stockStatus]);
    });
  }

  private writeGSTExcel(ws: ExcelJS.Worksheet, data: GSTReportData): void {
    ws.addRow(['GST Report']);
    ws.addRow([]);
    ws.addRow(['Invoice Date', 'GSTIN', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Invoice Value']);
    data.rows.forEach(r => {
      ws.addRow([r.invoiceDate, r.gstin, r.taxableValue, r.cgstAmount, r.sgstAmount, r.igstAmount, r.totalTax, r.invoiceValue]);
    });
    ws.addRow([]);
    ws.addRow(['HSN Summary']);
    ws.addRow(['HSN Code', 'Description', 'Qty', 'Taxable', 'CGST%', 'SGST%', 'IGST%', 'Total Tax']);
    data.hsnSummary.forEach(r => {
      ws.addRow([r.hsnCode, r.description, r.totalQuantity, r.taxableValue, r.cgstRate, r.sgstRate, r.igstRate, r.totalTax]);
    });
  }

  private writeAccountingExcel(ws: ExcelJS.Worksheet, data: AccountingReportData): void {
    ws.addRow(['Accounting Report']);
    ws.addRow([]);
    ws.addRow(['Date', 'Ledger', 'Voucher Type', 'Voucher No', 'Debit', 'Credit', 'Narration']);
    data.rows.forEach(r => {
      ws.addRow([r.date, r.ledgerName, r.voucherType, r.voucherNo, r.debit, r.credit, r.narration]);
    });
    ws.addRow([]);
    ws.addRow(['Cashflow']);
    ws.addRow(['Opening', data.cashflow.openingBalance]);
    ws.addRow(['Inflow', data.cashflow.totalInflow]);
    ws.addRow(['Outflow', data.cashflow.totalOutflow]);
    ws.addRow(['Net', data.cashflow.netFlow]);
    ws.addRow(['Closing', data.cashflow.closingBalance]);
  }

  private writeHRExcel(ws: ExcelJS.Worksheet, data: HRReportData): void {
    ws.addRow(['HR Report']);
    ws.addRow([]);
    ws.addRow(['Attendance']);
    ws.addRow(['Employee', 'Department', 'Month', 'Present', 'Absent', 'Leave', 'Half Days', 'OT Hours']);
    data.attendance.forEach(r => {
      ws.addRow([r.employeeName, r.department, r.month, r.presentDays, r.absentDays, r.leaveDays, r.halfDays, r.overtimeHours]);
    });
    ws.addRow([]);
    ws.addRow(['Salary Register']);
    ws.addRow(['Employee', 'Basic', 'HRA', 'DA', 'Allowances', 'Gross', 'PF', 'ESI', 'TDS', 'Other Ded.', 'Net']);
    data.salary.forEach(r => {
      ws.addRow([r.employeeName, r.basicSalary, r.hra, r.da, r.otherAllowances, r.grossSalary, r.pfDeduction, r.esiDeduction, r.tds, r.otherDeductions, r.netSalary]);
    });
  }

  private async generateCSV(
    reportType: ReportType,
    data: Record<string, unknown>,
    id: string
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const fileName = `${reportType}-report-${id}.csv`;
    const filePath = join(this.exportDir, fileName);

    // Simple CSV generation using ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    worksheet.addRow(['Report Type', reportType]);
    worksheet.addRow(['Generated At', new Date().toISOString()]);
    worksheet.addRow([]);
    worksheet.addRow(['Data']);
    worksheet.addRow([JSON.stringify(data)]);
    await workbook.csv.writeFile(filePath);

    const stats = await import('fs/promises').then(fs => fs.stat(filePath));
    return { filePath, fileName, fileSize: stats.size };
  }

  private getReportTitle(reportType: ReportType): string {
    const titles: Record<ReportType, string> = {
      sales: 'Sales Register & Margin Analysis',
      purchase: 'Purchase Register & PO Status',
      inventory: 'Stock Summary & Valuation',
      gst: 'Tax Liability & HSN Summary',
      accounting: 'Day Book, Cashflow & Aging',
      hr: 'Attendance & Salary Register',
      executive: 'Executive BI Dashboard',
    };
    return titles[reportType] || 'Report';
  }
}
