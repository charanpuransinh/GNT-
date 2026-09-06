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

/** FILE source: external data ek uploaded Excel/CSV/JSON file se (koi API nahi) */
async function fetchFileExternal(cc: Record<string, unknown>): Promise<Record<string, unknown>[]> {
  const fileKey = cc.fileKey as string | undefined;
  if (!fileKey) return []; // fail-closed: koi file nahi
  const ft = String(cc.fileType ?? 'csv').toLowerCase();
  try {
    const parsed =
      ft === 'csv' ? await CSVParser.parse(fileKey)
      : ft === 'json' ? await JSONParser.parse(fileKey)
      : await ExcelParser.parse(fileKey); // xlsx / xls
    return (parsed.rows ?? []) as Record<string, unknown>[];
  } catch (err) {
    throw new Error(`File external fetch failed (${ft}): ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function fetchExternalEntities(
  config: { sourceSystem?: string | null; connectionConfig?: unknown },
  entityConfig: { externalEntity?: string | null; internalEntity?: string | null },
  tenantId: string
): Promise<Record<string, unknown>[]> {
  // tenantId अभी file read me use nahi hota (file already tenant ke upload का है),
  // par signature cross-module sync flow se consistent rakhta hai।
  void tenantId;

  const src = (config.sourceSystem ?? '').toUpperCase();
  const cc = (config.connectionConfig ?? {}) as Record<string, unknown>;
  const entity = entityConfig.externalEntity ?? entityConfig.internalEntity ?? '';
  if (!entity) return [];

  // FILE/CSV/EXCEL/XLSX/XLS — uploaded file se (owner का "कोई API नहीं" फ़ैसला)
  if (src === 'FILE' || src === 'CSV' || src === 'EXCEL' || src === 'XLSX' || src === 'XLS') {
    return await fetchFileExternal(cc);
  }

  // API (Tally/Zoho) हटा दिया गया — unsupported ab honest empty
  return [];
}
