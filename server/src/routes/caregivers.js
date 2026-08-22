import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import { searchLimiter } from '../middleware/rateLimiter.js';
import { uploadDocument as uploadDocMw, uploadPhoto as uploadPhotoMw } from '../middleware/upload.js';
import { ROLES } from '../config/constants.js';
import {
  searchCaregivers,
  getCaregiverById,
  getCaregiverReviews,
  getAvailability,
  updateCaregiverProfile,
  uploadDocument,
  getMyDocuments,
  setAvailability,
  uploadProfilePhoto,
  getMyStats,
} from '../controllers/caregiverController.js';

const router = Router();

// Caregiver self-dashboard stats (must come before "/:id").
router.get('/me/stats', authenticate, requireRole(ROLES.CAREGIVER), getMyStats);

// Public browsing (optional auth adds nothing sensitive but is handy).
router.get('/', searchLimiter, optionalAuth, searchCaregivers);
router.get('/:id', optionalAuth, getCaregiverById);
router.get('/:id/reviews', getCaregiverReviews);
router.get('/:id/availability', getAvailability);

// Caregiver-owned mutations (ownership enforced inside the controller).
router.put(
  '/:id',
  authenticate,
  requireRole(ROLES.CAREGIVER),
  [
    body('bio').optional().isLength({ max: 2000 }),
    body('years_experience').optional().isInt({ min: 0, max: 70 }),
    body('hourly_rate_npr').optional().isFloat({ min: 0, max: 100000 }),
    body('serviceIds').optional().isArray(),
  ],
  validate,
  updateCaregiverProfile
);

router.post('/:id/documents', authenticate, requireRole(ROLES.CAREGIVER), uploadDocMw.single('file'), uploadDocument);
router.get('/:id/documents', authenticate, requireRole(ROLES.CAREGIVER), getMyDocuments);
router.put('/:id/availability', authenticate, requireRole(ROLES.CAREGIVER), setAvailability);
router.put('/:id/photo', authenticate, requireRole(ROLES.CAREGIVER), uploadPhotoMw.single('photo'), uploadProfilePhoto);

export default router;
