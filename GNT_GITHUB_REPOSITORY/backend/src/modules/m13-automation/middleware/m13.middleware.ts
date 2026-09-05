// M13 Automation Module - Validation Middleware (zod)

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '@/common/errors/error-classes';

export const validateMiddleware = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError('VALIDATION_ERROR', 'Request validation failed', 400));
    }
    req.body = result.data;
    next();
  };
};
