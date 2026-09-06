// M15 Sync Module — Entry Point Router
// GNT Team C | Modular Monolith Architecture

import { Router } from 'express';
import syncRoutes from './routes/sync.routes';
import { SyncEventSubscriber } from './events/sync.handlers';

const router = Router();

// event subscriber register (M11 payment.completed → real-time sync trigger)
SyncEventSubscriber.initialize();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'M15-Sync', version: '1.0.0' });
});

// Module routes
router.use('/', syncRoutes);

export default router;
