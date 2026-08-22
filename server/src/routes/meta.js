import { Router } from 'express';
import { listServices, getPublicMeta } from '../controllers/metaController.js';

const router = Router();
router.get('/services', listServices);
router.get('/meta/public', getPublicMeta);
export default router;
