// ============================================================================
// M14 — ExportService के unit tests (टास्क #024 — F1)
// पुराने tests गलत path ('../src/...') से टूटे थे — असली API पर नया shape test।
// createJob/processJob prisma पर टिके हैं (DB चाहिए) — अभी shape ही जाँचते हैं।
// ============================================================================

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ExportService } from './export.service';

describe('ExportService (shape — DB चालू होने तक)', () => {
  it('module लोड होता है और public methods मौजूद हैं', () => {
    assert.equal(typeof ExportService.createJob, 'function');
    assert.equal(typeof ExportService.processJob, 'function');
  });
});
