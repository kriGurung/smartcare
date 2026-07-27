import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import caregiverRoutes from './caregivers.js';
import bookingRoutes from './bookings.js';
import paymentRoutes from './payments.js';
import reviewRoutes from './reviews.js';
import notificationRoutes from './notifications.js';
import adminRoutes from './admin.js';
import fileRoutes from './files.js';
import metaRoutes from './meta.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'smartcare-api', time: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/caregivers', caregiverRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/files', fileRoutes);
router.use('/', metaRoutes); // /services, /meta/public

export default router;
