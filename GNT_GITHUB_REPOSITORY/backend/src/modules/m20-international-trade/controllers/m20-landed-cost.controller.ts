/**
 * M20 — Landed cost (मालिक की upload से लिया, 2026-09-03)
 * duty + CHA + freight का जोड़ — शुद्ध गणना, कोई database नहीं।
 */
import { Request, Response } from 'express';

export class M20LandedCostController {
  /** POST /landed-cost */
  async calculate(req: Request, res: Response) {
    const duty = Number(req.body?.duty ?? 0);
    const cha = Number(req.body?.cha ?? 0);
    const freight = Number(req.body?.freight ?? 0);

    if ([duty, cha, freight].some((x) => !Number.isFinite(x) || x < 0)) {
      return res.status(400).json({ success: false, error: 'Cost components must be non-negative numbers' });
    }
    return res.json({ success: true, data: { duty, cha, freight, total: duty + cha + freight } });
  }
}
