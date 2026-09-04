// M11 Payment Module - Error Middleware
// Centralized error handling

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { errorResponse } from '../utils/response.helper';
import { ApiError } from '../types';

export const errorMiddleware = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('M11 Error:', err);

  if ('code' in err) {
    // Custom ApiError
    const statusCode = err.code === 'NOT_FOUND' ? 404 : err.code === 'UNAUTHORIZED' ? 401 : 400;
    errorResponse(res, err.code, err.message, statusCode, err.details);
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      errorResponse(res, 'DUPLICATE', 'Record already exists', 409);
      return;
    }
    if (err.code === 'P2025') {
      errorResponse(res, 'NOT_FOUND', 'Record not found', 404);
      return;
    }
  }

  // Generic server error
  errorResponse(res, 'INTERNAL_ERROR', 'Internal server error', 500);
};
