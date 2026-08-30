import rateLimit from 'express-rate-limit';
import { RequestHandler } from 'express';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ success: false, message: 'Too many requests, please try again later.' }),
});

// In test environment we skip rate limiting to avoid flakey tests
export const apiRateLimiter: RequestHandler = process.env.NODE_ENV === 'test' ? ((req, _res, next) => next()) : limiter;
