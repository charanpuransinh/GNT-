// M15 Sync Module — Entry Point Router
// GNT Team C | Modular Monolith Architecture

import { Router } from 'express';
import syncRoutes from './routes/sync.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'M15-Sync', version: '1.0.0' });
});

// Module routes
router.use('/', syncRoutes);

export default router;
