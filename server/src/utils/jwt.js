import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../config/env.js';

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpires });
}

export function signRefreshToken(payload) {
  // Unique jti per token: without it two refresh tokens signed within the
  // same second are byte-identical, which silently breaks rotation (the old
  // token can't be distinguished from the new one when it is revoked).
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpires,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}
