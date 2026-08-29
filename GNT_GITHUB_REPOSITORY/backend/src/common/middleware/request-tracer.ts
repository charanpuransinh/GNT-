import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
export const requestTracer = (req: Request, res: Response, next: NextFunction) => { const id = String(req.header('x-request-id') || randomUUID()); res.setHeader('x-request-id', id); (req as any).requestId = id; next(); };
