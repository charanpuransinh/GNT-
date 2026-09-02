import { Request, Response, NextFunction } from 'express';

// साधारण in-memory API rate limiter (per IP)
// टास्क #003 में समीक्षक AI की लिखित अनुमति से बनाई गई फाइल —
// यह मॉड्यूल पहले पूरे repo में मौजूद ही नहीं था, पर m03/m04 routes इसे import करते थे (TS2307)।
// कोई बाहरी package नहीं लिया गया (express-rate-limit न installed है, न install करना है)।
// Production में आगे redis-backed limiter से बदला जा सकता है।

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 300;

const hits = new Map<string, { count: number; windowStart: number }>();

export const apiRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    next();
    return;
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    res.status(429).json({ success: false, error: 'Too many requests' });
    return;
  }
  next();
};
