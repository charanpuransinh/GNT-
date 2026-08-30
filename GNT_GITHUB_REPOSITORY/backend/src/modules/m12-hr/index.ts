// M12 — HR Module Entry Point
import { Router } from 'express';
import hrRoutes from './routes/hr.routes';

const router = Router();
router.use('/', hrRoutes);

export default router;
