import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import { ROLES } from '../config/constants.js';
import {
  initiate,
  sandboxCheckout,
  verify,
  listPayments,
  refund,
} from '../controllers/paymentController.js';

const router = Router();

// Public mock gateway page (redirect target).
router.get('/sandbox/checkout', sandboxCheckout);

router.post(
  '/initiate',
  authenticate,
  requireRole(ROLES.PATIENT),
  [body('booking_id').isInt(), body('method').isIn(['esewa', 'khalti', 'bank', 'cash'])],
  validate,
  initiate
);

// Finalize / callback (client return page calls this).
router.post('/verify', authenticate, [body('transaction_ref').notEmpty()], validate, verify);

router.get('/', authenticate, listPayments);
router.post('/:id/refund', authenticate, requireRole(ROLES.ADMIN), refund);

export default router;
