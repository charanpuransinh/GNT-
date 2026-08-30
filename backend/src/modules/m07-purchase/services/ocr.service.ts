import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
import { parseOCRText } from './purchase.internal';

export class TesseractOCRProvider {
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
    } catch (error: unknown) {
      const message = (error as any)?.code === 'ENOENT'
        ? 'Tesseract OCR binary is not installed or not available on PATH'
        : `OCR processing failed: ${error instanceof Error ? error.message : 'unknown error'}`;
      throw new Error(message);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}
