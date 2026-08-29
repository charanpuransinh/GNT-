/**
 * M08 SALES & BILLING — Frontend Print Service
 * Module: m08-sales | Team: B4-BRAVO
 * Helpers for print preview, window.print(), and PDF generation
 */

import { PrintTemplate } from './sales.types';

export class FrontendPrintService {
  /**
   * Open print preview in new window with generated HTML
   */
  static printHtml(html: string, title = 'Invoice Print'): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="UTF-8">
      </head>
      <body style="margin:0;padding:0;">
        ${html}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              // window.close(); // Optional: close after print
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  /**
   * Trigger browser print for current element
   */
  static printElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (!element) return;

    const originalContents = document.body.innerHTML;
    document.body.innerHTML = element.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  }

  /**
   * Download HTML as file
   */
  static downloadHtml(html: string, filename: string): void {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Share via WhatsApp
   */
  static shareWhatsApp(phone: string, message: string): void {
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${encoded}`;
    window.open(url, '_blank');
  }

  /**
   * Share via Email
   */
  static shareEmail(to: string, subject: string, body: string): void {
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  /**
   * Get template dimensions for CSS
   */
  static getTemplateDimensions(template: PrintTemplate): { width: string; fontSize: string } {
    switch (template) {
      case 'thermal-2inch':
        return { width: '58mm', fontSize: '11px' };
      case 'thermal-3inch':
        return { width: '80mm', fontSize: '12px' };
      case 'a4':
        return { width: '210mm', fontSize: '13px' };
      default:
        return { width: '210mm', fontSize: '13px' };
    }
  }
}

export default FrontendPrintService;
