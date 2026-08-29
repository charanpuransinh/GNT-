// M11 Payment Module - Response Helper
// Standardized API response formatting

import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: PaginationMeta
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta,
  };
  res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: Record<string, unknown>
): void => {
  const response: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
  res.status(statusCode).json(response);
};

export const createdResponse = <T>(res: Response, data: T): void => {
  successResponse(res, data, 201);
};

export const noContentResponse = (res: Response): void => {
  res.status(204).send();
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
