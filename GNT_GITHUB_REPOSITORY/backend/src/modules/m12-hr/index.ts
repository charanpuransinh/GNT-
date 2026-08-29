// [LOCK-15] M12 Module Entry
import express from 'express';
import hrRoutes from './routes/hr.routes';

const app = express();
app.use(express.json());
app.use('/api/m12/hr', hrRoutes);
app.get('/api/m12/health', (req, res) => {
  res.json({ module: 'M12-HR', status: 'healthy', version: '1.0.0' });
});
export default app;
