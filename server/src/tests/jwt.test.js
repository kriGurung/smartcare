import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt.js';
import env from '../config/env.js';

describe('JWT signing & verification', () => {
  it('signs and verifies an access token', () => {
    const token = signAccessToken({ sub: 7, role: 'patient' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe(7);
    expect(payload.role).toBe('patient');
  });

  it('signs and verifies a refresh token', () => {
    const token = signRefreshToken({ sub: 7 });
    expect(verifyRefreshToken(token).sub).toBe(7);
  });

  it('uses separate secrets for access vs refresh tokens', () => {
    const access = signAccessToken({ sub: 1 });
    // Verify an access token against the REFRESH secret must fail.
    expect(() => jwt.verify(access, env.jwt.refreshSecret)).toThrow();
  });

  it('rejects a token signed with the wrong secret', () => {
    const forged = jwt.sign({ sub: 1 }, 'attacker-secret');
    expect(() => verifyAccessToken(forged)).toThrow();
  });

  it('rejects tampered payloads', () => {
    const token = signAccessToken({ sub: 1 });
    const [h, p, s] = token.split('.');
    const tampered = [h, Buffer.from(JSON.stringify({ sub: 2, role: 'admin' })).toString('base64url'), s].join('.');
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('honours the configured expiry', () => {
    const token = signAccessToken({ sub: 1 });
    const payload = jwt.decode(token);
    expect(payload.exp - payload.iat).toBe(15 * 60); // 15m from test env
  });
});
