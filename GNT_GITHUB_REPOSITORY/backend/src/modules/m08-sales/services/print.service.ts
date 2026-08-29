/**
 * M08 SALES & BILLING — Print Template Service
 * Module: m08-sales | Team: B4-BRAVO
 * Generates HTML for thermal (58mm/80mm) and A4 print formats
 */

import { PrintTemplate, PrintRequestDTO } from '../types/sales.types';
import { PrintData, preparePrintData } from './sales.internal';

export class PrintService {
  generateThermal2Inch(data: PrintData): string {
    const { companyName, invoiceNumber, invoiceDate, customerName, items, totals, paymentMode } = data;
    const itemRows = items.map((i) =>
      `<tr>
        <td style="text-align:left;font-size:10px;">${i.qty}</td>
        <td style="text-align:left;font-size:10px;max-width:80px;overflow:hidden;">${i.description}</td>
        <td style="text-align:right;font-size:10px;">${i.rate.toFixed(2)}</td>
        <td style="text-align:right;font-size:10px;">${i.netAmount.toFixed(2)}</td>
      </tr>`
    ).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: 58mm auto; margin: 0; }
    body { font-family: 'Courier New', monospace; width: 58mm; margin: 0 auto; padding: 4px; font-size: 11px; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .right { text-align: right; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1px 2px; }
    .divider { border-top: 1px dashed #000; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="center bold" style="font-size:13px;">${companyName}</div>
  <div class="center" style="font-size:9px;">TAX INVOICE</div>
  <div class="divider"></div>
  <div>Inv#: ${invoiceNumber}</div>
  <div>Date: ${invoiceDate}</div>
  <div>Cust: ${customerName}</div>
  <div class="divider"></div>
  <table>
    <tr style="font-size:10px;border-bottom:1px solid #000;">
      <th style="text-align:left;">Qty</th>
      <th style="text-align:left;">Item</th>
      <th style="text-align:right;">Rate</th>
      <th style="text-align:right;">Amt</th>
    </tr>
    ${itemRows}
  </table>
  <div class="divider"></div>
  <table>
    <tr><td>Subtotal</td><td class="right">${totals.totalAmount.toFixed(2)}</td></tr>
    <tr><td>Discount</td><td class="right">${totals.totalDiscount.toFixed(2)}</td></tr>
    <tr><td>Tax</td><td class="right">${totals.totalTax.toFixed(2)}</td></tr>
    <tr><td>Round Off</td><td class="right">${totals.roundOff.toFixed(2)}</td></tr>
    <tr class="bold" style="font-size:12px;"><td>GRAND TOTAL</td><td class="right">₹${totals.grandTotal.toFixed(2)}</td></tr>
  </table>
  <div class="divider"></div>
  <div>Payment: ${paymentMode}</div>
  <div class="center" style="margin-top:8px;font-size:9px;">Thank you! Visit again.</div>
  <div class="center" style="font-size:8px;">Powered by RAKSHA | GNT</div>
</body>
</html>`;
  }

  generateThermal3Inch(data: PrintData): string {
    const { companyName, companyAddress, companyGstin, invoiceNumber, invoiceDate, dueDate, customerName, customerAddress, customerGstin, items, totals, paymentMode, terms, notes } = data;
    const itemRows = items.map((i) =>
      `<tr>
        <td style="text-align:center;font-size:11px;">${i.sno}</td>
        <td style="text-align:left;font-size:11px;">${i.description}</td>
        <td style="text-align:center;font-size:11px;">${i.hsn}</td>
        <td style="text-align:center;font-size:11px;">${i.qty}</td>
        <td style="text-align:right;font-size:11px;">${i.rate.toFixed(2)}</td>
        <td style="text-align:right;font-size:11px;">${i.amount.toFixed(2)}</td>
        <td style="text-align:right;font-size:11px;">${i.taxAmount.toFixed(2)}</td>
        <td style="text-align:right;font-size:11px;">${i.netAmount.toFixed(2)}</td>
      </tr>`
    ).join('');

    const taxRows = totals.taxBreakup.map((t) =>
      `<tr><td>CGST @ ${t.rate/2}%</td><td class="right">${t.cgst.toFixed(2)}</td></tr>
       <tr><td>SGST @ ${t.rate/2}%</td><td class="right">${t.sgst.toFixed(2)}</td></tr>`
    ).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: 80mm auto; margin: 0; }
    body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 6px; font-size: 12px; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .right { text-align: right; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 2px 4px; }
    .divider { border-top: 1px dashed #000; margin: 4px 0; }
    .header { font-size: 14px; }
  </style>
</head>
<body>
  <div class="center bold header">${companyName}</div>
  <div class="center" style="font-size:10px;">${companyAddress}</div>
  <div class="center" style="font-size:10px;">GSTIN: ${companyGstin}</div>
  <div class="center bold" style="margin-top:4px;">TAX INVOICE</div>
  <div class="divider"></div>
  <table>
    <tr><td><b>Inv#:</b> ${invoiceNumber}</td><td class="right"><b>Date:</b> ${invoiceDate}</td></tr>
    <tr><td><b>Due:</b> ${dueDate}</td><td class="right"></td></tr>
  </table>
  <div class="divider"></div>
  <div><b>Bill To:</b> ${customerName}</div>
  <div style="font-size:10px;">${customerAddress}</div>
  <div style="font-size:10px;">GSTIN: ${customerGstin}</div>
  <div class="divider"></div>
  <table>
    <tr style="border-bottom:1px solid #000;font-size:11px;">
      <th>#</th><th>Item</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Amt</th><th>Tax</th><th>Net</th>
    </tr>
    ${itemRows}
  </table>
  <div class="divider"></div>
  <table>
    <tr><td>Subtotal</td><td class="right">${totals.totalAmount.toFixed(2)}</td></tr>
    <tr><td>Discount</td><td class="right">${totals.totalDiscount.toFixed(2)}</td></tr>
    ${taxRows}
    <tr><td>Round Off</td><td class="right">${totals.roundOff.toFixed(2)}</td></tr>
    <tr class="bold" style="font-size:13px;"><td>GRAND TOTAL</td><td class="right">₹${totals.grandTotal.toFixed(2)}</td></tr>
  </table>
  <div class="divider"></div>
  <div><b>Payment Mode:</b> ${paymentMode}</div>
  <div style="font-size:10px;margin-top:4px;"><b>Terms:</b> ${terms}</div>
  <div style="font-size:10px;"><b>Notes:</b> ${notes}</div>
  <div class="center" style="margin-top:10px;font-size:10px;">Thank you for your business!</div>
  <div class="center" style="font-size:9px;">Powered by RAKSHA | GNT</div>
</body>
</html>`;
  }

  generateA4(data: PrintData): string {
    const { companyName, companyAddress, companyGstin, invoiceNumber, invoiceDate, dueDate, customerName, customerAddress, customerGstin, items, totals, paymentMode, terms, notes } = data;
    const itemRows = items.map((i) =>
      `<tr>
        <td style="border:1px solid #ccc;padding:6px;text-align:center;">${i.sno}</td>
        <td style="border:1px solid #ccc;padding:6px;">${i.description}<br/><small>HSN: ${i.hsn}</small></td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center;">${i.qty}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right;">₹${i.rate.toFixed(2)}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right;">₹${i.amount.toFixed(2)}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right;">${i.discount.toFixed(2)}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right;">${i.taxRate}%</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right;">₹${i.taxAmount.toFixed(2)}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right;">₹${i.netAmount.toFixed(2)}</td>
      </tr>`
    ).join('');

    const taxRows = totals.taxBreakup.map((t) =>
      `<tr><td style="padding:4px 8px;">CGST @ ${t.rate/2}%</td><td style="text-align:right;padding:4px 8px;">₹${t.cgst.toFixed(2)}</td></tr>
       <tr><td style="padding:4px 8px;">SGST @ ${t.rate/2}%</td><td style="text-align:right;padding:4px 8px;">₹${t.sgst.toFixed(2)}</td></tr>`
    ).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #0F172A; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563EB; padding-bottom: 12px; margin-bottom: 16px; }
    .company-info h1 { margin: 0; font-size: 22px; color: #2563EB; }
    .company-info p { margin: 2px 0; color: #64748B; font-size: 12px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { margin: 0; font-size: 18px; color: #DC2626; }
    .invoice-meta p { margin: 2px 0; font-size: 12px; }
    .party-section { display: flex; justify-content: space-between; margin: 16px 0; }
    .party-box { width: 48%; border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px; background: #F8FAFC; }
    .party-box h4 { margin: 0 0 6px 0; color: #2563EB; font-size: 13px; }
    .party-box p { margin: 2px 0; font-size: 12px; }
    table.items { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
    table.items th { background: #2563EB; color: white; padding: 8px; text-align: center; font-weight: 600; }
    .totals-section { display: flex; justify-content: flex-end; margin-top: 16px; }
    .totals-box { width: 320px; }
    .totals-box table { width: 100%; font-size: 13px; }
    .totals-box td { padding: 6px 8px; }
    .totals-box .grand-total { font-size: 16px; font-weight: bold; color: #2563EB; border-top: 2px solid #2563EB; }
    .footer { margin-top: 30px; border-top: 1px solid #E2E8F0; padding-top: 12px; font-size: 11px; color: #64748B; }
    .signature-area { display: flex; justify-content: space-between; margin-top: 40px; }
    .sign-box { width: 200px; text-align: center; }
    .sign-line { border-top: 1px solid #0F172A; margin-top: 40px; padding-top: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${companyName}</h1>
      <p>${companyAddress}</p>
      <p><strong>GSTIN:</strong> ${companyGstin}</p>
    </div>
    <div class="invoice-meta">
      <h2>TAX INVOICE</h2>
      <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
      <p><strong>Date:</strong> ${invoiceDate}</p>
      <p><strong>Due Date:</strong> ${dueDate}</p>
    </div>
  </div>
  <div class="party-section">
    <div class="party-box">
      <h4>Bill To</h4>
      <p><strong>${customerName}</strong></p>
      <p>${customerAddress}</p>
      <p><strong>GSTIN:</strong> ${customerGstin}</p>
    </div>
    <div class="party-box">
      <h4>Ship To</h4>
      <p><strong>${customerName}</strong></p>
      <p>${customerAddress}</p>
    </div>
  </div>
  <table class="items">
    <tr>
      <th>#</th><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th><th>Disc</th><th>Tax%</th><th>Tax Amt</th><th>Net Amt</th>
    </tr>
    ${itemRows}
  </table>
  <div class="totals-section">
    <div class="totals-box">
      <table>
        <tr><td>Subtotal</td><td style="text-align:right;">₹${totals.totalAmount.toFixed(2)}</td></tr>
        <tr><td>Total Discount</td><td style="text-align:right;">₹${totals.totalDiscount.toFixed(2)}</td></tr>
        ${taxRows}
        <tr><td>Round Off</td><td style="text-align:right;">₹${totals.roundOff.toFixed(2)}</td></tr>
        <tr class="grand-total"><td>GRAND TOTAL</td><td style="text-align:right;">₹${totals.grandTotal.toFixed(2)}</td></tr>
        <tr><td colspan="2" style="font-size:11px;color:#64748B;padding-top:8px;">Amount in words: ${numberToWords(totals.grandTotal)}</td></tr>
      </table>
    </div>
  </div>
  <div style="margin-top:16px;font-size:12px;">
    <p><strong>Payment Mode:</strong> ${paymentMode}</p>
    <p><strong>Terms & Conditions:</strong> ${terms}</p>
    <p><strong>Notes:</strong> ${notes}</p>
  </div>
  <div class="signature-area">
    <div class="sign-box">
      <div class="sign-line">Customer Signature</div>
    </div>
    <div class="sign-box">
      <div class="sign-line">Authorized Signature</div>
    </div>
  </div>
  <div class="footer">
    <p>This is a computer-generated invoice and does not require a physical signature.</p>
    <p style="text-align:center;">Powered by RAKSHA | GARUDA NEXTECH (GNT)</p>
  </div>
</body>
</html>`;
  }

  generatePrint(template: PrintTemplate, data: PrintData): string {
    switch (template) {
      case 'thermal-2inch':
        return this.generateThermal2Inch(data);
      case 'thermal-3inch':
        return this.generateThermal3Inch(data);
      case 'a4':
        return this.generateA4(data);
      default:
        throw new Error(`Unknown print template: ${template}`);
    }
  }
}

// ─── HELPERS ───

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n: number): string {
    if (n === 0) return 'Zero';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = convert(rupees) + ' Rupees';
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  return result + ' Only';
}

export const printService = new PrintService();
