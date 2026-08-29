// M15 Sync Module — Entry Point
// GNT Team C | Modular Monolith Architecture

import express from 'express';
import syncRoutes from './routes/sync.routes';
import { errorHandler } from './utils/sync.errors';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'M15-Sync', version: '1.0.0' });
});

// Module routes — all prefixed with /api/v1/m15
app.use('/api/v1/m15', syncRoutes);

// Global error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

const PORT = process.env.M15_PORT || 3015;
app.listen(PORT, () => {
  console.log(`🔄 M15 Sync Module running on port ${PORT}`);
});

export default app;
