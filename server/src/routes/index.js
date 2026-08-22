import { Router } from 'express';
import sequelize from '../config/database.js';
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
import reportRoutes from './reports.js';

const router = Router();

// Health check — pings the database so monitors (CloudWatch, the deploy
// workflow's smoke test) can tell a running-but-broken API from a healthy one.
router.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', service: 'smartcare-api', database: 'ok', time: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'degraded', service: 'smartcare-api', database: 'unreachable', time: new Date().toISOString() });
  }
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/caregivers', caregiverRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);
router.use('/files', fileRoutes);
router.use('/', metaRoutes); // /services, /meta/public

export default router;
