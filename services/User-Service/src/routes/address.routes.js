import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createAddressSchema, updateAddressSchema } from '../validation/address.schema.js';
import {
  listAddressesController,
  createAddressController,
  updateAddressController,
  deleteAddressController,
  setDefaultAddressController,
} from '../controllers/address.controller.js';

const router = Router();

// All address routes require an authenticated user
router.use(requireAuth);

router.get('/', listAddressesController);
router.post('/', validate(createAddressSchema), createAddressController);
router.put('/:id', validate(updateAddressSchema), updateAddressController);
router.delete('/:id', deleteAddressController);
router.patch('/:id/default', setDefaultAddressController);

export default router;
