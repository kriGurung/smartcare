import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import { ROLES } from '../config/constants.js';
import {
  getPendingCaregivers,
  getCaregiverDocuments,
  reviewDocument,
  verifyCaregiver,
  rejectCaregiver,
  listUsers,
  updateUserStatus,
  getSummary,
  getRevenue,
  getBookingsTrend,
  getSettings,
  updateSettings,
  moderateReview,
} from '../controllers/adminController.js';

const router = Router();

// Every admin route: authenticated AND role=admin (§9.2 double-check).
router.use(authenticate, requireRole(ROLES.ADMIN));

// Verification queue
router.get('/caregivers/pending', getPendingCaregivers);
router.get('/caregivers/:id/documents', getCaregiverDocuments);
router.put('/caregivers/:id/verify', verifyCaregiver);
router.put('/caregivers/:id/reject', [body('reason').trim().notEmpty()], validate, rejectCaregiver);
router.put('/documents/:id/review', reviewDocument);

// User management
router.get('/users', listUsers);
router.put('/users/:id/status', [body('status').isIn(['active', 'suspended'])], validate, updateUserStatus);

// Reports
router.get('/reports/summary', getSummary);
router.get('/reports/revenue', getRevenue);
router.get('/reports/bookings-trend', getBookingsTrend);

// Settings & moderation
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.put('/reviews/:id/moderate', moderateReview);

export default router;
