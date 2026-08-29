import { Router } from 'express';
import { TemplateController } from '../controllers/template.controller';

const router = Router();

router.post('/', TemplateController.create);
router.put('/:id', TemplateController.update);
router.delete('/:id', TemplateController.delete);
router.get('/:id', TemplateController.getById);
router.get('/', TemplateController.list);
router.get('/default/:entityType', TemplateController.getDefault);

export default router;
