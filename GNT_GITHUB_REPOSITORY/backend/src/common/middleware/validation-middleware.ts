import { Request, Response, NextFunction } from 'express';
export const validationMiddleware = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  try { const parsed = schema?.parse ? schema.parse(req.body) : req.body; req.body = parsed; next(); }
  catch (error) { res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Validation failed' }); }
};
