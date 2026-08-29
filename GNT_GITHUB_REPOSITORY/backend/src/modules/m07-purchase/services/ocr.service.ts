// ============================================================================
// M07 PURCHASE MANAGEMENT — OCR Service
// ============================================================================

import { OCRResultDTO, OCRProposedFieldDTO, OCRProposedItemDTO } from '../types/purchase.types';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
import { parseOCRText } from './purchase.internal';


function isSupportedImage(buffer: Buffer): boolean {
  const png = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  const jpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const webp = buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return png || jpeg || webp;
}

export interface OCRProvider {
  extractText(imageBuffer: Buffer): Promise<string>;
}


export class TesseractOCRProvider implements OCRProvider {
  constructor(private readonly binary = 'tesseract') {}

  async extractText(imageBuffer: Buffer): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'gnt-m07-ocr-'));
    const input = join(dir, 'invoice');
    const image = `${input}.img`;
    try {
      await writeFile(image, imageBuffer);
      const { stdout } = await execFileAsync(this.binary, [image, 'stdout', '--psm', '6'], {
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60_000,
      });
      return stdout;
    } catch (error: any) {
      const message = error?.code === 'ENOENT'
        ? 'Tesseract OCR binary is not installed or not available on PATH'
        : `OCR processing failed: ${error?.message || 'unknown error'}`;
      throw new Error(message);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}

/**
 * Production boundary for OCR. A real provider (Tesseract/Cloud Vision/Textract)
 * must be injected by the application composition root. No fabricated invoice
 * data is ever returned when the provider is not configured.
 */
export class OCRService {
  constructor(private readonly provider: OCRProvider) {}

  async processImage(imageBuffer: Buffer): Promise<OCRResultDTO> {
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      throw new Error('A non-empty invoice image is required');
    }
    if (!isSupportedImage(imageBuffer)) {
      throw new Error('Unsupported invoice image format; PNG, JPEG, or WebP required');
    }
    const rawText = await this.provider.extractText(imageBuffer);
    if (!rawText.trim()) throw new Error('OCR provider returned no text');
    return this.buildOCRResult(parseOCRText(rawText));
  }

  private buildOCRResult(parsed: ReturnType<typeof parseOCRText>): OCRResultDTO {
    const clamp = (n: number) => Math.max(0, Math.min(100, n));
    const buildField = (field: string, value: string | number | Date, confidence: number): OCRProposedFieldDTO => ({
      field, value, confidence: clamp(confidence), accepted: false,
    });
    const buildItem = (item: { product_name: string; quantity: number; rate: number; amount: number }, confidence: number): OCRProposedItemDTO => ({
      product_name: item.product_name, quantity: item.quantity, rate: item.rate, amount: item.amount,
      confidence: clamp(confidence), accepted: false,
    });

    return {
      supplier_name: buildField('supplier_name', parsed.supplier_name, parsed.confidence),
      invoice_number: buildField('invoice_number', parsed.invoice_number, parsed.confidence),
      invoice_date: buildField('invoice_date', new Date(parsed.invoice_date), parsed.confidence),
      total_amount: buildField('total_amount', parsed.total_amount, parsed.confidence),
      total_tax: buildField('total_tax', parsed.total_tax, parsed.confidence),
      items: parsed.items.map(item => buildItem(item, parsed.confidence)),
      overall_confidence: clamp(parsed.confidence),
    };
  }

  validateOCRReview(ocrResult: OCRResultDTO): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredFields: (keyof OCRResultDTO)[] = ['supplier_name', 'invoice_number', 'invoice_date', 'total_amount'];
    for (const field of requiredFields) {
      const fieldData = ocrResult[field] as OCRProposedFieldDTO | undefined;
      if (!fieldData || !fieldData.accepted) errors.push(`Field "${field}" must be reviewed and accepted`);
    }
    if (ocrResult.items.length === 0) errors.push('At least one item must be extracted');
    for (let i = 0; i < ocrResult.items.length; i++) {
      if (!ocrResult.items[i].accepted) errors.push(`Item ${i + 1} must be reviewed and accepted`);
    }
    return { valid: errors.length === 0, errors };
  }
}
