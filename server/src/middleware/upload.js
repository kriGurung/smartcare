import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import env from '../config/env.js';
import ApiError from '../utils/apiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadRoot = path.resolve(__dirname, '../../', env.upload.dir);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Verification documents: PDF/JPG/PNG only, size-capped, stored privately
// on disk (local equivalent of a private S3 bucket, §9.5).
const DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function makeStorage(subfolder) {
  return multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(uploadRoot, subfolder);
      ensureDir(dir);
      cb(null, dir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = crypto.randomBytes(12).toString('hex');
      cb(null, `${Date.now()}_${unique}${ext}`);
    },
  });
}

function fileFilterFor(allowed) {
  return (req, file, cb) => {
    if (!allowed.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported file type. Allowed: ${allowed.join(', ')}`));
    }
    cb(null, true);
  };
}

export const uploadDocument = multer({
  storage: makeStorage('documents'),
  limits: { fileSize: env.upload.maxMb * 1024 * 1024 },
  fileFilter: fileFilterFor(DOC_TYPES),
});

export const uploadPhoto = multer({
  storage: makeStorage('photos'),
  limits: { fileSize: env.upload.maxMb * 1024 * 1024 },
  fileFilter: fileFilterFor(PHOTO_TYPES),
});

export { uploadRoot };
