import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import { ROLES } from '../config/constants.js';
import {
  createUserReport,
  listUserReports,
  reviewUserReport,
} from '../controllers/reportController.js';

const router = Router();

// Any authenticated user can report
router.post(
  '/',
  authenticate,
  [
    body('reported_id').isInt().withMessage('reported_id is required'),
    body('reason').isIn(['inappropriate_behavior', 'fraud', 'safety_concern', 'fake_profile', 'other']).withMessage('Valid reason required'),
    body('description').optional().isLength({ max: 1000 }),
  ],
  validate,
  createUserReport
);

// Admin routes for reviewing reports
router.get('/admin', authenticate, requireRole(ROLES.ADMIN), listUserReports);
router.put('/admin/:id', authenticate, requireRole(ROLES.ADMIN), reviewUserReport);

export default router;
