// M12 — TDS Section service tests (no DB — pure config + arithmetic)
import { describe, it, expect, afterEach, vi } from 'vitest';
import { writeFileSync, rmSync, mkdtempSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TdsSectionService, tdsSectionService } from './tds-section.service';

const tempConfigDirs: string[] = [];
function writeTempConfig(contents: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), 'tds-cfg-'));
  const file = join(dir, 'tds_slabs.json');
  writeFileSync(file, typeof contents === 'string' ? contents : JSON.stringify(contents));
  tempConfigDirs.push(dir);
  return file;
}
afterEach(() => {
  for (const dir of tempConfigDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
  vi.restoreAllMocks();
});

describe('TdsSectionService — reads the committed config/tds_slabs.json', () => {
  it('serves the three sections from the file, not the fallback', () => {
    const config = tdsSectionService.getConfig();
    expect(config.source).toBe('file');
    expect(Object.keys(config.sections).sort()).toEqual(['194C', '194I', '194J']);
    expect(tdsSectionService.isUsingConfigFile()).toBe(true);
  });

  it('194C — 1% for individual/HUF, 2% for everyone else, above the 30k threshold', () => {
    const individual = tdsSectionService.calculate({ section: '194C', amount: 100000, deducteeType: 'individual' });
    expect(individual.applicableRate).toBe(0.01);
    expect(individual.tdsAmount).toBe(1000);
    expect(individual.netPayable).toBe(99000);
    expect(individual.source).toBe('file');

    const company = tdsSectionService.calculate({ section: '194C', amount: 100000, deducteeType: 'company' });
    expect(company.applicableRate).toBe(0.02);
    expect(company.tdsAmount).toBe(2000);
  });

  it('194J — flat 10% above 50k', () => {
    const result = tdsSectionService.calculate({ section: '194J', amount: 200000, deducteeType: 'firm' });
    expect(result.applicableRate).toBe(0.1);
    expect(result.tdsAmount).toBe(20000);
  });

  it('194I — flat 2% above 2.4L', () => {
    const result = tdsSectionService.calculate({ section: '194I', amount: 300000 });
    expect(result.applicableRate).toBe(0.02);
    expect(result.tdsAmount).toBe(6000);
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
    const configPath = writeTempConfig({
      meta: { fy: '2027-28' },
      sections: { '194J': { label: 'prof fees', rate: 0.12, threshold: 75000 } },
    });
    const service = new TdsSectionService(configPath);
    const initial = service.calculate({ section: '194J', amount: 100000 });
    expect(initial.applicableRate).toBe(0.12);
    expect(initial.threshold).toBe(75000);
    expect(initial.source).toBe('file');

    // owner edits the file: rate 12% -> 15%
    writeFileSync(configPath, JSON.stringify({ sections: { '194J': { rate: 0.15, threshold: 75000 } } }));
    utimesSync(configPath, new Date(), new Date(Date.now() + 1000)); // bump mtime

    const updated = service.calculate({ section: '194J', amount: 100000 });
    expect(updated.applicableRate).toBe(0.15);
    expect(updated.tdsAmount).toBe(15000);
  });

  it('new sections can be added purely in the file', () => {
    const configPath = writeTempConfig({
      sections: { '194Q': { label: 'purchase of goods', rate: 0.001, threshold: 5000000 } },
    });
    const service = new TdsSectionService(configPath);
    const result = service.calculate({ section: '194Q', amount: 6000000 });
    expect(result.tdsAmount).toBe(6000);
  });
});

describe('TdsSectionService — fallback only when the file is unusable', () => {
  it('missing file => in-code fallback with the owner-supplied current rates, source flagged', () => {
    const service = new TdsSectionService('/no/such/path/tds_slabs.json');
    expect(service.isUsingConfigFile()).toBe(false);

    const resolved = service.calculate({ section: '194C', amount: 100000, deducteeType: 'individual' });
    expect(resolved).toMatchObject({ applicableRate: 0.01, threshold: 30000, source: 'fallback' });
    expect(service.calculate({ section: '194C', amount: 100000, deducteeType: 'company' }).applicableRate).toBe(0.02);
    expect(service.calculate({ section: '194J', amount: 100000 })).toMatchObject({ applicableRate: 0.1, threshold: 50000 });
    expect(service.calculate({ section: '194I', amount: 300000 })).toMatchObject({ applicableRate: 0.02, threshold: 240000 });
  });

  it('malformed JSON => fallback, does not throw', () => {
    const configPath = writeTempConfig('{ not valid json');
    const service = new TdsSectionService(configPath);
    expect(service.calculate({ section: '194C', amount: 100000 }).source).toBe('fallback');
  });

  it('out-of-range / non-numeric rate in the file => whole file rejected, fallback, error logged', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const configPath = writeTempConfig({
      sections: {
        '194J': { rate: 1.5, threshold: 50000 },        // 150% — impossible
        '194C': { rate_ind: 0.01, rate_other: 0.02, threshold: 30000 },
      },
    });
    const service = new TdsSectionService(configPath);
    // even the valid 194C section is not trusted from this file — the whole file is bad
    const result = service.calculate({ section: '194C', amount: 100000, deducteeType: 'individual' });
    expect(result.source).toBe('fallback');
    expect(service.isUsingConfigFile()).toBe(false);
    expect(consoleError).toHaveBeenCalled();
  });

  it('negative threshold in the file => rejected, fallback', () => {
    const configPath = writeTempConfig({ sections: { '194J': { rate: 0.1, threshold: -1 } } });
    const service = new TdsSectionService(configPath);
    expect(service.calculate({ section: '194J', amount: 100000 }).source).toBe('fallback');
  });

  it('file present but missing a section => that section resolves from fallback', () => {
    const configPath = writeTempConfig({
      sections: { '194C': { rate_ind: 0.005, rate_other: 0.01, threshold: 30000 } },
    });
    const service = new TdsSectionService(configPath);
    expect(service.calculate({ section: '194C', amount: 100000, deducteeType: 'individual' }).applicableRate).toBe(0.005);
    // 194J not in this file -> fallback
    expect(service.calculate({ section: '194J', amount: 100000 })).toMatchObject({ applicableRate: 0.1, source: 'fallback' });
  });
});
