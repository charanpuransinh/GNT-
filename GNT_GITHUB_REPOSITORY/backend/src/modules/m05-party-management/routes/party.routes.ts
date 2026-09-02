// ============================================================================
// M05 PARTY MANAGEMENT — Routes
// ⚠️ रास्ते `/` से शुरू — `/parties/` से नहीं (M17/M20 वाली दोहरे-पते की गलती न दोहराना)
//    mount: /api/v1/parties → असली पते /api/v1/parties, /api/v1/parties/:id
// ============================================================================

import { Router } from 'express';
import { PartyController } from '../controllers/party.controller';
import { partyService } from '../services/party.service';

export function createPartyRouter(controller: PartyController): Router {
  const router = Router();

  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.deactivate);
  router.get('/:id/outstanding', controller.getOutstanding);
  router.get('/:id/aging', controller.getAging);

  return router;
}

export default createPartyRouter(new PartyController(partyService));
