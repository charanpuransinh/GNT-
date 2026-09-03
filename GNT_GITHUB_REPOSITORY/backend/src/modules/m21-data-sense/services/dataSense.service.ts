/**
 * M21 — PUBLIC API (orchestration)
 *
 * SENSE → MAP → VALIDATE → PREVIEW तक का पूरा सफ़र, बिना database के।
 * (TRANSFER — यानी M05/M06/M08… में असल में डालना — अगले चरण में, owner के
 *  बाक़ी 3 फ़ैसलों के बाद; इसीलिए यहाँ जान-बूझकर नहीं है।)
 */
import {
  DEFAULT_OPTIONS,
  type AnalyzeResult,
  type DataSenseOptions,
  type IntakeSheet,
  type RowVerdict,
} from '../types/dataSense.types';
import { mapRow, senseSheet } from './sense.engine';
import { findDuplicates, validateRow } from './validate.engine';
import { buildTransferPlan } from './transfer.planner';

export class DataSenseService {
  /**
   * ग्राहक की एक sheet को समझो, जाँचो और preview बनाओ।
   * companyId ज़रूरी है — हर नतीजा उसी कंपनी का होता है (tenant सुरक्षा)।
   */
  analyze(companyId: string, sheet: IntakeSheet, options?: Partial<DataSenseOptions>): AnalyzeResult {
    // मालिक के तय defaults; UI का toggle सिर्फ़ इन्हें ऊपर से बदलता है
    const opts: DataSenseOptions = { ...DEFAULT_OPTIONS, ...options };
    if (!companyId) {
      throw new Error('companyId ज़रूरी है — tenant के बिना data sense नहीं चलेगा');
    }
    if (!Array.isArray(sheet.headers) || sheet.headers.length === 0) {
      throw new Error('फ़ाइल में headers नहीं मिले');
    }

    const sense = senseSheet(sheet);

    // समझ ही नहीं आया कि किस चीज़ का data है — तो अंदाज़े से आगे मत बढ़ो
    if (!sense.group) {
      return {
        companyId,
        sheetName: sheet.sheetName ?? 'sheet1',
        options: opts,
        sense,
        totals: { rows: sheet.rows.length, green: 0, orange: 0, red: sheet.rows.length },
        verdicts: sheet.rows.map((_, i) => ({
          rowNumber: i + 1,
          status: 'RED' as const,
          zone: 'blocked' as const,
          reasons: ['यह फ़ाइल किस चीज़ की है, पहचाना नहीं जा सका — column के नाम ठीक करके दोबारा भेजें'],
          mapped: {},
        })),
        duplicateGroups: [],
        reviewZone: [],
        suspenseZone: [],
        transferPlan: [],
        importable: false,
      };
    }

    const verdicts: RowVerdict[] = sheet.rows.map((row, i) =>
      validateRow(mapRow(row, sense.mappings), sense.group as NonNullable<typeof sense.group>, i + 1, opts),
    );

    const duplicateGroups = findDuplicates(verdicts, sense.group);
    const reviewZone = verdicts.filter((v) => v.zone === 'review').map((v) => v.rowNumber);
    const suspenseZone = verdicts.filter((v) => v.zone === 'suspense').map((v) => v.rowNumber);
    const transferPlan = buildTransferPlan(verdicts, sense.group, opts);

    const totals = {
      rows: verdicts.length,
      green: verdicts.filter((v) => v.status === 'GREEN').length,
      orange: verdicts.filter((v) => v.status === 'ORANGE').length,
      red: verdicts.filter((v) => v.status === 'RED').length,
    };

    return {
      companyId,
      sheetName: sheet.sheetName ?? 'sheet1',
      options: opts,
      sense,
      totals,
      verdicts,
      duplicateGroups,
      reviewZone,
      suspenseZone,
      transferPlan,
      // बिना सुधारे import तभी, जब कोई RED न हो, कोई ज़रूरी field ग़ायब न हो,
      // और कोई पंक्ति Review/Suspense में न रुकी हो (फ़ैसला 1 और 2B)
      importable:
        totals.red === 0 &&
        sense.missingRequiredFields.length === 0 &&
        reviewZone.length === 0 &&
        suspenseZone.length === 0,
    };
  }
}

export const dataSenseService = new DataSenseService();
