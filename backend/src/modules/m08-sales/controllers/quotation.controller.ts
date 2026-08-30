import { Request, Response } from 'express';

export class QuotationController {
  // ... existing methods ...

  async create(req: Request, res: Response) {
    try {
      // business logic
      res.status(201).json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create quotation';
      res.status(400).json({ success: false, error: message });
    }
  }
}
