import crypto from 'crypto';
import env from '../config/env.js';
import logger from './logger.js';

// AES-256-GCM column-level encryption for the most sensitive fields
// (national ID numbers, health notes) — the local equivalent of the
// AWS RDS column encryption described in the plan (§9.3).

const ALGO = 'aes-256-gcm';

function getKey() {
  const hex = env.fieldEncryptionKey;
  if (!hex || hex.length !== 64) {
    logger.warn('FIELD_ENCRYPTION_KEY missing or not 32 bytes (64 hex chars); sensitive fields will NOT be encrypted.');
    return null;
  }
  return Buffer.from(hex, 'hex');
}

export function encryptField(plaintext) {
  if (plaintext == null || plaintext === '') return plaintext;
  const key = getKey();
  if (!key) return plaintext;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store as iv:tag:ciphertext (all base64), prefixed so we can detect encrypted values.
  return `enc::${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

export function decryptField(value) {
  if (value == null || typeof value !== 'string' || !value.startsWith('enc::')) return value;
  const key = getKey();
  if (!key) return value;
  try {
    const [, payload] = value.split('enc::');
    const [ivB64, tagB64, dataB64] = payload.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch (err) {
    logger.error('Failed to decrypt field: %s', err.message);
    return null;
  }
}
