// M12 — HR Module Entry Point
import { Router } from 'express';
import hrRoutes from './routes/hr.routes';

const router = Router();
router.use('/', hrRoutes);

export default router;
export { HRService, hrService } from './services/hr.service';
export { TaxSlabService, taxSlabService } from './services/tax-slab.service';
export { TdsSectionService, tdsSectionService } from './services/tds-section.service';
