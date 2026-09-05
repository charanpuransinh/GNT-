// ============================================================================
// M13 — cron matcher (5 fields: minute hour day-of-month month day-of-week)
//
// बाहरी library नहीं (network बंद है), इसलिए छोटा ख़ुद का matcher।
// सपोर्ट: *  ,  -  /  और संख्याएँ। समय-क्षेत्र Intl से (job के timezone में match)।
// ============================================================================

type FieldRange = [number, number];

const RANGES: FieldRange[] = [
  [0, 59], // minute
  [0, 23], // hour
  [1, 31], // day of month
  [1, 12], // month
  [0, 6], // day of week (0 = Sunday)
];

function parseField(field: string, min: number, max: number): Set<number> {
  const values = new Set<number>();
  const parts = field.split(',');
  if (parts.some((p) => p.trim() === '')) {
    throw new Error(`cron field ख़राब है: "${field}"`);
  }
  for (const rawPart of parts) {
    const part = rawPart.trim();
    let base = part;
    let step = 1;
    if (part.includes('/')) {
      const [b, s] = part.split('/');
      base = b;
      step = Number.parseInt(s, 10);
      if (Number.isNaN(step) || step < 1) {
        throw new Error(`cron step ख़राब है: "${field}"`);
      }
    }
    let lo: number;
    let hi: number;
    if (base === '*') {
      lo = min;
      hi = max;
    } else if (base.includes('-')) {
      const [a, b] = base.split('-');
      lo = Number.parseInt(a, 10);
      hi = Number.parseInt(b, 10);
    } else {
      lo = Number.parseInt(base, 10);
      hi = lo;
    }
    if (Number.isNaN(lo) || Number.isNaN(hi) || lo < min || hi > max || lo > hi) {
      throw new Error(`cron मान ग़लत है: "${field}" (सीमा ${min}–${max})`);
    }
    for (let v = lo; v <= hi; v += step) values.add(v);
  }
  return values;
}

export function isValidTimezone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

interface TzComponents {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
  hour: number; // 0–23
  minute: number; // 0–59
  dow: number; // 0–6 (Sunday = 0)
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function getTzComponents(date: Date, timeZone: string): TzComponents {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const pick = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  const dowShort = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  return {
    year: Number.parseInt(pick('year'), 10),
    month: Number.parseInt(pick('month'), 10),
    day: Number.parseInt(pick('day'), 10),
    hour: Number.parseInt(pick('hour'), 10),
    minute: Number.parseInt(pick('minute'), 10),
    dow: WEEKDAY_INDEX[dowShort] ?? 0,
  };
}

/** क्या यह cron-expression इस पल (दिए गए timezone में) मैच करता है */
export function cronMatches(cronExpr: string, date: Date, timeZone = 'UTC'): boolean {
  const fields = cronExpr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`cron में 5 fields चाहिए (minute hour dom month dow): "${cronExpr}"`);
  }
  if (!isValidTimezone(timeZone)) {
    throw new Error(`अज्ञात timezone: "${timeZone}"`);
  }
  const sets = fields.map((f, i) => parseField(f, RANGES[i][0], RANGES[i][1]));
  const c = getTzComponents(date, timeZone);
  const domMatch = sets[2].has(c.day);
  const dowMatch = sets[4].has(c.dow);
  // Standard cron नियम: दोनों restricted हों तो OR, वरना AND
  const domRestricted = !fields[2].trim().startsWith('*');
  const dowRestricted = !fields[4].trim().startsWith('*');
  const dayMatches = domRestricted && dowRestricted ? domMatch || dowMatch : domMatch && dowMatch;
  return sets[0].has(c.minute) && sets[1].has(c.hour) && dayMatches && sets[3].has(c.month);
}

/** अगला run — from के बाद का पहला मैच (timezone में), 366 दिन तक खोज */
export function nextRunAfter(cronExpr: string, from: Date, timeZone = 'UTC'): Date {
  const t = new Date(from.getTime());
  t.setSeconds(0, 0);
  t.setMinutes(t.getMinutes() + 1);
  const limit = new Date(t.getTime() + 366 * 24 * 3600 * 1000);
  while (t <= limit) {
    if (cronMatches(cronExpr, t, timeZone)) return new Date(t.getTime());
    t.setMinutes(t.getMinutes() + 1);
  }
  throw new Error(`cron का अगला run 366 दिन में नहीं मिला: "${cronExpr}"`);
}
