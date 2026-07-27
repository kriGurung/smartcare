import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import env from '../config/env.js';
import { ROLES } from '../config/constants.js';
import { CaregiverDocument } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadRoot = path.resolve(__dirname, '../../', env.upload.dir);

// Prevents path traversal — only a bare filename is allowed.
function safeName(name) {
  const base = path.basename(name);
  if (base !== name || name.includes('..')) throw ApiError.badRequest('Invalid file name');
  return base;
}

// GET /api/files/documents/:filename  — verification docs (private, §9.5)
// Only the owning caregiver or an admin may download. This is the local
// equivalent of a private bucket served via short-lived signed URLs.
export const getDocument = asyncHandler(async (req, res) => {
  const filename = safeName(req.params.filename);
  const doc = await CaregiverDocument.findOne({ where: { file_path: filename } });
  if (!doc) throw ApiError.notFound('Document not found');

  const isOwner = req.user.role === ROLES.CAREGIVER && doc.caregiver_id === req.user.id;
  const isAdmin = req.user.role === ROLES.ADMIN;
  if (!isOwner && !isAdmin) throw ApiError.forbidden('You cannot access this document');

  const filePath = path.join(uploadRoot, 'documents', filename);
  if (!fs.existsSync(filePath)) throw ApiError.notFound('File missing on disk');
  res.sendFile(filePath);
});

// GET /api/files/photos/:filename  — profile photos (public)
export const getPhoto = asyncHandler(async (req, res) => {
  const filename = safeName(req.params.filename);
  const filePath = path.join(uploadRoot, 'photos', filename);
  if (!fs.existsSync(filePath)) throw ApiError.notFound('Image not found');
  res.sendFile(filePath);
});
