// M12 — TDS Section service tests (no DB — pure config + arithmetic)
import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, rmSync, mkdtempSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TdsSectionService, tdsSectionService } from './tds-section.service';

const tmpFiles: string[] = [];
function tmpConfig(contents: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), 'tds-cfg-'));
  const file = join(dir, 'tds_slabs.json');
  writeFileSync(file, typeof contents === 'string' ? contents : JSON.stringify(contents));
  tmpFiles.push(dir);
  return file;
}
afterEach(() => {
  while (tmpFiles.length) rmSync(tmpFiles.pop()!, { recursive: true, force: true });
});

describe('TdsSectionService — reads the committed config/tds_slabs.json', () => {
  it('serves the three sections from the file, not the fallback', () => {
    const cfg = tdsSectionService.getConfig();
    expect(cfg.source).toBe('file');
    expect(Object.keys(cfg.sections).sort()).toEqual(['194C', '194I', '194J']);
    expect(tdsSectionService.isUsingConfigFile()).toBe(true);
  });

  it('194C — 1% for individual/HUF, 2% for everyone else, above the 30k threshold', () => {
    const ind = tdsSectionService.calculate({ section: '194C', amount: 100000, deducteeType: 'individual' });
    expect(ind.applicableRate).toBe(0.01);
    expect(ind.tdsAmount).toBe(1000);
    expect(ind.netPayable).toBe(99000);
    expect(ind.source).toBe('file');

    const co = tdsSectionService.calculate({ section: '194C', amount: 100000, deducteeType: 'company' });
    expect(co.applicableRate).toBe(0.02);
    expect(co.tdsAmount).toBe(2000);
  });

  it('194J — flat 10% above 50k', () => {
    const r = tdsSectionService.calculate({ section: '194J', amount: 200000, deducteeType: 'firm' });
    expect(r.applicableRate).toBe(0.1);
    expect(r.tdsAmount).toBe(20000);
  });

  it('194I — flat 2% above 2.4L', () => {
    const r = tdsSectionService.calculate({ section: '194I', amount: 300000 });
    expect(r.applicableRate).toBe(0.02);
    expect(r.tdsAmount).toBe(6000);
  });

  it('at or below the section threshold => zero TDS', () => {
    expect(tdsSectionService.calculate({ section: '194C', amount: 30000 }).tdsAmount).toBe(0);
    expect(tdsSectionService.calculate({ section: '194C', amount: 30000 }).belowThreshold).toBe(true);
    expect(tdsSectionService.calculate({ section: '194J', amount: 49999.99 }).tdsAmount).toBe(0);
  });

  it('section name is case-insensitive and trimmed', () => {
    expect(tdsSectionService.calculate({ section: ' 194c ', amount: 100000 }).section).toBe('194C');
  });

  it('unknown section throws a helpful error', () => {
    expect(() => tdsSectionService.calculate({ section: '194Q', amount: 100000 })).toThrow(/Unknown TDS section/);
  });

  it('rejects a negative amount', () => {
    expect(() => tdsSectionService.calculate({ section: '194C', amount: -1 })).toThrow(/non-negative/);
  });
});

describe('TdsSectionService — external file is the source of truth', () => {
  it('a Budget change is picked up by editing the file only (no code change)', () => {
    const path = tmpConfig({
      meta: { fy: '2027-28' },
      sections: { '194J': { label: 'prof fees', rate: 0.12, threshold: 75000 } },
    });
    const svc = new TdsSectionService(path);
    const before = svc.calculate({ section: '194J', amount: 100000 });
    expect(before.applicableRate).toBe(0.12);
    expect(before.threshold).toBe(75000);
    expect(before.source).toBe('file');

    // owner edits the file: rate 12% -> 15%
    writeFileSync(path, JSON.stringify({ sections: { '194J': { rate: 0.15, threshold: 75000 } } }));
    utimesSync(path, new Date(), new Date(Date.now() + 1000)); // bump mtime

    const after = svc.calculate({ section: '194J', amount: 100000 });
    expect(after.applicableRate).toBe(0.15);
    expect(after.tdsAmount).toBe(15000);
  });

  it('new sections can be added purely in the file', () => {
    const path = tmpConfig({ sections: { '194Q': { label: 'purchase of goods', rate: 0.001, threshold: 5000000 } } });
    const svc = new TdsSectionService(path);
    const r = svc.calculate({ section: '194Q', amount: 6000000 });
    expect(r.tdsAmount).toBe(6000);
  });
});

describe('TdsSectionService — fallback only when the file is unusable', () => {
  it('missing file => in-code fallback with the owner-supplied current rates, source flagged', () => {
    const svc = new TdsSectionService('/no/such/path/tds_slabs.json');
    expect(svc.isUsingConfigFile()).toBe(false);

    const c = svc.calculate({ section: '194C', amount: 100000, deducteeType: 'individual' });
    expect(c).toMatchObject({ applicableRate: 0.01, threshold: 30000, source: 'fallback' });
    expect(svc.calculate({ section: '194C', amount: 100000, deducteeType: 'company' }).applicableRate).toBe(0.02);
    expect(svc.calculate({ section: '194J', amount: 100000 })).toMatchObject({ applicableRate: 0.1, threshold: 50000 });
    expect(svc.calculate({ section: '194I', amount: 300000 })).toMatchObject({ applicableRate: 0.02, threshold: 240000 });
  });

  it('malformed JSON => fallback, does not throw', () => {
    const path = tmpConfig('{ not valid json');
    const svc = new TdsSectionService(path);
    expect(svc.calculate({ section: '194C', amount: 100000 }).source).toBe('fallback');
  });

  it('file present but missing a section => that section resolves from fallback', () => {
    const path = tmpConfig({ sections: { '194C': { rate_ind: 0.005, rate_other: 0.01, threshold: 30000 } } });
    const svc = new TdsSectionService(path);
    expect(svc.calculate({ section: '194C', amount: 100000, deducteeType: 'individual' }).applicableRate).toBe(0.005);
    // 194J not in this file -> fallback
    expect(svc.calculate({ section: '194J', amount: 100000 })).toMatchObject({ applicableRate: 0.1, source: 'fallback' });
  });
});
