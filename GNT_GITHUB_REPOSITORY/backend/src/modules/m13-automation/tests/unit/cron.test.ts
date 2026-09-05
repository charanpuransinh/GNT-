// ============================================================================
// M13 — cron matcher unit tests (कोई DB नहीं)
// ============================================================================

import { describe, it, expect } from 'vitest';
import { cronMatches, nextRunAfter, isValidTimezone } from '../../utils/cron';

function at(y: number, mo: number, d: number, h: number, mi: number, tz = 'UTC'): Date {
  // Date.UTC सीधा UTC instant देता है
  return new Date(Date.UTC(y, mo - 1, d, h, mi, 0, 0));
}

describe('M13 cron matcher', () => {
  it('* * * * * — हर मिनट मैच करता है', () => {
    expect(cronMatches('* * * * *', at(2026, 1, 1, 10, 30))).toBe(true);
    expect(cronMatches('* * * * *', at(2026, 1, 1, 23, 59))).toBe(true);
  });

  it('सटीक मिनट/घंटा मैच', () => {
    expect(cronMatches('30 10 * * *', at(2026, 1, 1, 10, 30))).toBe(true);
    expect(cronMatches('30 10 * * *', at(2026, 1, 1, 10, 31))).toBe(false);
    expect(cronMatches('30 10 * * *', at(2026, 1, 1, 11, 30))).toBe(false);
  });

  it('*/15 — हर 15 मिनट', () => {
    expect(cronMatches('*/15 * * * *', at(2026, 1, 1, 10, 0))).toBe(true);
    expect(cronMatches('*/15 * * * *', at(2026, 1, 1, 10, 15))).toBe(true);
    expect(cronMatches('*/15 * * * *', at(2026, 1, 1, 10, 16))).toBe(false);
  });

  it('रेंज 9-17 घंटे', () => {
    expect(cronMatches('0 9-17 * * *', at(2026, 1, 1, 9, 0))).toBe(true);
    expect(cronMatches('0 9-17 * * *', at(2026, 1, 1, 17, 0))).toBe(true);
    expect(cronMatches('0 9-17 * * *', at(2026, 1, 1, 18, 0))).toBe(false);
  });

  it('weekday (सोमवार=1)', () => {
    // 2026-01-05 = सोमवार
    expect(cronMatches('0 9 * * 1', at(2026, 1, 5, 9, 0))).toBe(true);
    expect(cronMatches('0 9 * * 1', at(2026, 1, 6, 9, 0))).toBe(false); // मंगलवार
  });

  it('nextRunAfter भविष्य की तारीख़ देता है', () => {
    const from = at(2026, 1, 1, 10, 0);
    const next = nextRunAfter('0 9 * * *', from);
    // अगली सुबह 9:00
    expect(next.getTime()).toBeGreaterThan(from.getTime());
    expect(cronMatches('0 9 * * *', next)).toBe(true);
  });

  it('ग़लत cron गिनती पर error', () => {
    expect(() => cronMatches('* * *', new Date())).toThrow();
  });

  it('timezone जाँच', () => {
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('Asia/Kolkata')).toBe(true);
    expect(isValidTimezone('Bilkul/Galat')).toBe(false);
  });
});
