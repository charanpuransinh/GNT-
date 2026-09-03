/**
 * M20 — Packing list / CBM calculator (मालिक की upload से लिया, 2026-09-03)
 *
 * सिर्फ़ गणना — कोई database नहीं, इसलिए tenant scope की ज़रूरत नहीं
 * (route auth के पीछे है)। `breakdown`/`threeD` वाले stub endpoints
 * जान-बूझकर नहीं लिए — वे ख़ाली जवाब लौटाते थे।
 */
import { Request, Response } from 'express';
import { M20ContainerCBMService } from '../services/m20-container-cbm.service';

export class M20PackingListController {
  constructor(private readonly cbm = new M20ContainerCBMService()) {}

  /** POST /cbm-calc — L×W×H×Qty ÷ 10,00,000 और container का चुनाव */
  async optimize(req: Request, res: Response) {
    try {
      return res.json({ success: true, data: this.cbm.calculate(req.body.items) });
    } catch (e) {
      return res.status(400).json({ success: false, error: e instanceof Error ? e.message : 'Invalid packing input' });
    }
  }
}
