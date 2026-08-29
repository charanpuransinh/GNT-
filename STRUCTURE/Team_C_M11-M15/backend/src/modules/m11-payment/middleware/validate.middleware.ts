// M11 Payment Module - Validation Middleware
// Zod schema validation for request bodies

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { errorResponse } from '../utils/response.helper';

export const validateMiddleware = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      errorResponse(res, 'VALIDATION_ERROR', 'Request validation failed', 400, { errors });
      return;
    }
    req.body = result.data;
    next();
  };
};
