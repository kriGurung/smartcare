import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDocument, getPhoto } from '../controllers/fileController.js';

const router = Router();
// Verification documents require auth + ownership/admin (private).
router.get('/documents/:filename', authenticate, getDocument);
// Profile photos are public.
router.get('/photos/:filename', getPhoto);
export default router;
