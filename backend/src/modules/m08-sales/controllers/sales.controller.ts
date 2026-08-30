import { Request, Response } from 'express';

// Placeholder sales controller with safe error handling
export class SalesController {
  async getInvoice(req: Request, res: Response) {
    try {
      // existing logic
      res.status(200).json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get invoice';
      res.status(400).json({ success: false, error: message });
    }
  }
}
