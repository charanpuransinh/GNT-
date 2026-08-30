/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT MODULE — BACKEND ENTRY                    ║
 * ║  Lock Artifact #1 — Module Index                             ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { Router } from 'express';
import importRoutesList from './routes/import.routes';
import exportRoutesList from './routes/export.routes';

export { default as importRoutes } from './routes/import.routes';
export { default as exportRoutes } from './routes/export.routes';
export * from './types/importExport.types';
export * from './services/importService';
export * from './services/exportService';
export * from './services/queueService';
export * from './utils/csvParser';
export * from './utils/excelHandler';
export * from './utils/fieldMapper';
export * from './constants/importExportConfig';
