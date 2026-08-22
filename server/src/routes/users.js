import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { getMe, updateMe } from '../controllers/userController.js';

const router = Router();

router.use(authenticate);
router.get('/me', getMe);
router.put(
  '/me',
  [
    body('name').optional().trim().isLength({ min: 2, max: 120 }),
    body('phone').optional().trim().isLength({ min: 7, max: 20 }),
    body('language_pref').optional().isIn(['en', 'ne']),
  ],
  validate,
  updateMe
);

export default router;
