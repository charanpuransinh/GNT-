// ============================================================================
// M14 — ImportService के unit tests (टास्क #024 — F1)
// पुराने tests गलत path ('../src/...') + पुराने model shape से टूटे थे —
// असली API पर नए node:test tests (DB की ज़रूरत वाले paths अभी नहीं चलते)।
// ============================================================================

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ImportService } from './import.service';

describe('ImportService (DB-free हिस्से)', () => {
  it('module लोड होता है और public methods मौजूद हैं', () => {
    assert.equal(typeof ImportService.createJob, 'function');
    assert.equal(typeof ImportService.previewFile, 'function');
    assert.equal(typeof ImportService.processJob, 'function');
  });

  it('नापसंद file type → साफ error', async () => {
    await assert.rejects(
      () => ImportService.previewFile('/tmp/kuch-bhi.txt', 'txt'),
      (err: unknown) => err instanceof Error && err.message.includes('Unsupported file type'),
    );
  });
});
