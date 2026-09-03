// ============================================================================
// M15 — SyncService के shape/smoke tests (टास्क #024 — F1)
//
// पुराना jest-based test टूटा हुआ था (jest namespace + गलत path) — उसकी जगह
// यह सच्चा test: module लोड होता है और public methods मौजूद हैं (DB की ज़रूरत
// नहीं — यही सीमा यहाँ तक चल सकती है; असली DB-backed flows तब test होंगे जब
// database चालू होगा)। झूठे pass नहीं — shape ही जाँचा जाता है।
// ============================================================================

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { SyncService } from './sync.service';

describe('SyncService (shape — DB चालू होने तक)', () => {
  it('module लोड होता है और public static methods मौजूद हैं', () => {
    assert.equal(typeof SyncService.createConfig, 'function');
    assert.equal(typeof SyncService.getConfig, 'function');
    assert.equal(typeof SyncService.getConfigByCode, 'function');
    assert.equal(typeof SyncService.listConfigs, 'function');
    assert.equal(typeof SyncService.updateConfig, 'function');
    assert.equal(typeof SyncService.deleteConfig, 'function');
    assert.equal(typeof SyncService.triggerSync, 'function');
    assert.equal(typeof SyncService.getJobStatus, 'function');
    assert.equal(typeof SyncService.listJobs, 'function');
    assert.equal(typeof SyncService.cancelJob, 'function');
    assert.equal(typeof SyncService.getJobProgress, 'function');
    assert.equal(typeof SyncService.previewSync, 'function');
    assert.equal(typeof SyncService.syncEntity, 'function');
  });
});
