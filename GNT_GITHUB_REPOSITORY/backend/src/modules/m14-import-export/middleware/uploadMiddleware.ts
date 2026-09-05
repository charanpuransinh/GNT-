/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — UPLOAD MIDDLEWARE                       ║
 * ║  Lock Artifact #11 — Multer File Upload Handler              ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// ── Allowed File Types ──
const ALLOWED_MIMETYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  'application/xml',
  'text/xml',
];

const ALLOWED_EXTENSIONS = ['.csv', '.xls', '.xlsx', '.json', '.xml'];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ── Storage Configuration ──
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // tenant JWT से (req.tenant) — कभी spoofable x-tenant-id header से नहीं
    const tenantId = req.tenant?.companyId || 'default';
    const uploadDir = path.join(process.cwd(), 'uploads', tenantId, 'imports');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${randomStr}${ext}`);
  },
});

// ── File Filter ──
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
  }
};

// ── Multer Instance ──
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// ── Error Handler ──
export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

// ── Cleanup Old Uploads ──
export const cleanupOldUploads = async (maxAgeHours = 24): Promise<void> => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) return;

  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000;

  const deleteOld = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        deleteOld(filePath);
      } else if (now - stat.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`[M14] Cleaned up: ${filePath}`);
      }
    }
  };

  deleteOld(uploadsDir);
};
