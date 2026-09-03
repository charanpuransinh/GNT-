/** M21 — HTTP परत */
import type { NextFunction, Request, Response } from 'express';
import { dataSenseService } from '../services/dataSense.service';
import { analyzeSheetSchema } from '../validators/dataSense.schema';
import { GROUP_SPECS } from '../services/sense.engine';
import { DATA_GROUP_OWNER } from '../index';
import { DEFAULT_OPTIONS } from '../types/dataSense.types';

export class DataSenseController {
  /** POST /api/v1/data-sense/analyze */
  async analyze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.tenant?.companyId ?? (req.user?.companyId as string);
      if (!companyId) {
        res.status(400).json({ success: false, error: 'company_id required' });
        return;
      }
      const { options, ...sheet } = analyzeSheetSchema.parse(req.body);
      const result = dataSenseService.analyze(companyId, sheet, options);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/v1/data-sense/options — UI के toggles और उनके default (मालिक के 3 फ़ैसले) */
  async options(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        defaults: DEFAULT_OPTIONS,
        toggles: [
          {
            key: 'duplicatePolicy',
            label: 'दोहरी पंक्तियाँ',
            fixed: true,
            choices: [{ value: 'review-zone', label: 'Review Zone — इंसान देखे तभी आगे (मालिक का फ़ैसला 1)' }],
          },
          {
            key: 'nonGstinParty',
            label: 'बिना GSTIN वाली पार्टी',
            choices: [
              { value: 'b2c-auto-create', label: 'B2C बनाकर चलाओ (default)' },
              { value: 'suspense-zone', label: 'Suspense में रोको' },
            ],
          },
          {
            key: 'bankReconciliation',
            label: 'बैंक मिलान',
            choices: [
              { value: 'direct-ledger-credit', label: 'सीधे पार्टी खाते में जमा — M10 (default)' },
              { value: 'fifo-invoice-settlement', label: 'पुराने बिल से क्रम में चुकता — M11' },
            ],
          },
        ],
      },
    });
  }

  /** GET /api/v1/data-sense/field-map — कौन सा group किस module का, और उसके fields */
  async fieldMap(_req: Request, res: Response): Promise<void> {
    const data = Object.entries(GROUP_SPECS).map(([group, spec]) => ({
      group,
      ownerModule: DATA_GROUP_OWNER[group as keyof typeof DATA_GROUP_OWNER],
      required: spec.required,
      fields: Object.keys(spec.fields),
    }));
    res.json({ success: true, data });
  }
}

export const dataSenseController = new DataSenseController();
