import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { listNotifications, markRead, markAllRead } from '../controllers/notificationController.js';

const router = Router();
router.use(authenticate);
router.get('/', listNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
export default router;
