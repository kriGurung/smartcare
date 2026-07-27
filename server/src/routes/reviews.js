import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { ROLES } from '../config/constants.js';
import { createReview, getMyReviews } from '../controllers/reviewController.js';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  requireRole(ROLES.PATIENT),
  writeLimiter,
  [
    body('booking_id').isInt(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isLength({ max: 1000 }),
  ],
  validate,
  createReview
);
router.get('/mine', requireRole(ROLES.CAREGIVER), getMyReviews);

export default router;
