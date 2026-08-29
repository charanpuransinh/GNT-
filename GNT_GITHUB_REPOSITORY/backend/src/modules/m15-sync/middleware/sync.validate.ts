// M15 Sync Module — Validation Middleware
// GNT Team C | Modular Monolith Architecture

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/sync.errors';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new AppError('VALIDATION_ERROR', `Validation failed: ${issues}`, 400);
    }
    req.body = result.data;
    next();
  };
};
