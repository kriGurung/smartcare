import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { ROLES } from '../config/constants.js';
import {
  createBooking,
  listBookings,
  getBooking,
  updateBookingStatus,
  adminOverrideStatus,
  addCareLog,
  listCareLogs,
} from '../controllers/bookingController.js';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  requireRole(ROLES.PATIENT),
  writeLimiter,
  [
    body('caregiver_id').isInt().withMessage('caregiver_id is required'),
    body('location_type').isIn(['home', 'hospital']),
    body('address').trim().isLength({ min: 3, max: 300 }).withMessage('Address is required'),
    body('start_datetime').isISO8601().withMessage('Valid start date/time required'),
    body('end_datetime').isISO8601().withMessage('Valid end date/time required'),
    body('latitude').optional({ values: 'null' }).isFloat({ min: -90, max: 90 }),
    body('longitude').optional({ values: 'null' }).isFloat({ min: -180, max: 180 }),
  ],
  validate,
  createBooking
);

router.get('/', listBookings);
router.get('/:id', getBooking);
router.put(
  '/:id/status',
  [
    body('action').isIn(['accept', 'decline', 'start', 'complete', 'cancel', 'reschedule']),
    body('latitude').optional({ values: 'null' }).isFloat({ min: -90, max: 90 }),
    body('longitude').optional({ values: 'null' }).isFloat({ min: -180, max: 180 }),
    body('reason').optional().isLength({ max: 300 }),
  ],
  validate,
  updateBookingStatus
);
router.put('/:id/override', requireRole(ROLES.ADMIN), adminOverrideStatus);

// Care logs
router.post(
  '/:id/care-logs',
  requireRole(ROLES.CAREGIVER),
  [body('tasks_completed').optional().isLength({ max: 1000 }), body('observations').optional().isLength({ max: 1000 })],
  validate,
  addCareLog
);
router.get('/:id/care-logs', listCareLogs);

export default router;
