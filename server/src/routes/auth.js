import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { register, login, refresh, logout } from '../controllers/authController.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('phone').trim().isLength({ min: 7, max: 20 }).withMessage('A valid phone number is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn([ROLES.PATIENT, ROLES.CAREGIVER]).withMessage('Invalid role'),
    body('consent')
      .custom((v) => v === true || v === 'true' || v === 1 || v === '1')
      .withMessage('You must accept the privacy consent'),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
