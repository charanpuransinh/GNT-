// ============================================================================
// M15 — External data source: FILE-BASED import (Excel/CSV/JSON)
//
// Owner का फ़ैसला: कोई API/credential नहीं — बाहरी system (Tally/Zoho/etc.) का
// data सिर्फ़ uploaded file (Excel/CSV/JSON) se aayega। Pehle yahan Tally (XML)
// aur Zoho (REST) ke API connectors the — unhe हटा दिया गया (credential/auth
// ki ज़रूरत + multi-tenant routing ka cross-tenant risk tha)।
//
// Fail-closed rules:
//   - fileKey na ho → [] (honest empty, koi fake sync nahi)
//   - file parse fail → throw (sync job error record kare, chupchap 0-sync nahi)
// ============================================================================

import { CSVParser } from '@/modules/m14-import-export/utils/csvParser';
import { ExcelParser } from '@/modules/m14-import-export/utils/excelParser';
import { JSONParser } from '@/modules/m14-import-export/utils/jsonParser';

const FILE_SOURCES = new Set(['FILE', 'CSV', 'EXCEL', 'XLSX', 'XLS']);
const NO_FETCH_SOURCES = new Set(['INTERNAL', '']);

/** ek uploaded file ko uske type ke hisab se parse karo */
async function parseByType(fileKey: string, fileType: string): Promise<Record<string, unknown>[]> {
  let parsed;
  if (fileType === 'csv') parsed = await CSVParser.parse(fileKey);
  else if (fileType === 'json') parsed = await JSONParser.parse(fileKey);
  else parsed = await ExcelParser.parse(fileKey); // xlsx / xls
  return (parsed.rows ?? []) as Record<string, unknown>[];
}

/** FILE source: external data ek uploaded Excel/CSV/JSON file se (koi API nahi) */
async function fetchFileExternal(cc: Record<string, unknown>): Promise<Record<string, unknown>[]> {
  const fileKey = cc.fileKey as string | undefined;
  if (!fileKey) return []; // fail-closed: koi file nahi
  const ft = String(cc.fileType ?? 'csv').toLowerCase();
  try {
    return await parseByType(fileKey, ft);
  } catch (err) {
    throw new Error(`File external fetch failed (${ft}): ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function fetchExternalEntities(
  config: { sourceSystem?: string | null; connectionConfig?: unknown },
  entityConfig: { externalEntity?: string | null; internalEntity?: string | null },
  // file already tenant ke upload ka hai — signature cross-module flow se consistent rakhne ko hai
  _tenantId: string
): Promise<Record<string, unknown>[]> {
  const src = (config.sourceSystem ?? '').toUpperCase();
  const entity = entityConfig.externalEntity ?? entityConfig.internalEntity ?? '';
  if (!entity) return [];

  // FILE/CSV/EXCEL/XLSX/XLS — uploaded file se (owner का "कोई API नहीं" फ़ैसला)
  if (FILE_SOURCES.has(src)) {
    return fetchFileExternal((config.connectionConfig ?? {}) as Record<string, unknown>);
  }

  // INTERNAL — external side ka data internal engine hi bharta hai (yahan kuch nahi)
  if (NO_FETCH_SOURCES.has(src)) return [];

  // API connectors (TALLY / ZOHO / QUICKBOOKS / ...) hata diye gaye — chupchap 0-sync nahi,
  // saaf error taaki sync job FAILED ho aur user ko FILE source use karna pata chale.
  throw new Error(
    `M15 sync: external source "${src}" ka API connector hata diya gaya hai (owner: koi API/credential nahi). ` +
    `sourceSystem=FILE rakh kar uploaded Excel/CSV/JSON se sync karein.`
  );
}
