// Data Sense — तारीख़ पढ़ने की एक ही जगह (validate + transfer दोनों यही इस्तेमाल करें)।
//
// भारत की फाइलों में तारीख़ लगभग हमेशा **दिन पहले** होती है: dd/mm/yyyy या dd-mm-yyyy।
// JavaScript का `new Date("01/04/2026")` इसे 4 January मान लेता है (महीना पहले) — इसीलिए
// यहाँ खुद component तोड़कर, असली कैलेंडर तारीख़ जाँचकर बनाते हैं।

/** दिन-पहले (dd/mm/yyyy, dd-mm-yyyy) या ISO (yyyy-mm-dd) — और कुछ नहीं। */
export function tryParseImportDate(value: unknown): Date | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (s === '') return null;

  // ISO: yyyy-mm-dd (वैकल्पिक समय) — जैसा है वैसा
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?)?$/.exec(s);
  if (iso) {
    return buildDate(Number(iso[3]), Number(iso[2]), Number(iso[1]));
  }

  // दिन-पहले: dd/mm/yyyy या dd-mm-yyyy (yy भी चलेगा → 20yy)
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/.exec(s);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    return buildDate(day, month, year);
  }

  return null;
}

/** parse या फिर साफ़ error — transfer के वक़्त गलत तारीख़ चुपचाप नहीं जानी चाहिए। */
export function parseImportDate(value: unknown): Date {
  const d = tryParseImportDate(value);
  if (!d) {
    throw new Error(`तारीख़ पढ़ी नहीं जा सकी: "${String(value)}" (dd/mm/yyyy या yyyy-mm-dd चाहिए)`);
  }
  return d;
}

// असली कैलेंडर तारीख़ ही माने — 31/02, 00/01, महीना 13 वग़ैरह null
function buildDate(day: number, month: number, year: number): Date | null {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 9999) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null; // rollover (जैसे 31 Feb → 3 Mar) = अमान्य
  }
  return d;
}
