import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, resetDatabase, apiRegister, apiLogin, seedBaseline, TEST_PASSWORD, User, CaregiverProfile } from './helpers.js';
import { ROLES } from '../config/constants.js';

const REFRESH_COOKIE = 'smartcare_refresh';

function cookieValue(res) {
  const header = res.headers['set-cookie'];
  if (!header) return null;
  const line = Array.isArray(header) ? header.find((c) => c.startsWith(`${REFRESH_COOKIE}=`)) : header;
  return line ? line.split(';')[0].slice(REFRESH_COOKIE.length + 1) : null;
}

describe('Authentication & account security', () => {
  beforeAll(async () => {
    await resetDatabase();
    await seedBaseline();
  });

  describe('POST /api/auth/register', () => {
    it('registers a patient and returns a token + refresh cookie', async () => {
      const res = await apiRegister({ name: 'Pema', email: 'pema@test.local' });
      expect(res.status).toBe(201);
      expect(res.body.user).toMatchObject({ email: 'pema@test.local', role: ROLES.PATIENT });
      expect(res.body.user.password_hash).toBeUndefined();
      expect(res.body.accessToken).toBeTruthy();
      expect(cookieValue(res)).toBeTruthy();
    });

    it('registers a caregiver and provisions a caregiver profile', async () => {
      const res = await apiRegister({ name: 'Kiran', email: 'kiran@test.local', role: ROLES.CAREGIVER });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe(ROLES.CAREGIVER);
      const profile = await CaregiverProfile.findOne({ where: { user_id: res.body.user.id } });
      expect(profile).toBeTruthy();
      expect(profile.verification_status).toBe('pending');
    });

    it('never lets a user self-register as admin', async () => {
      // Route validation rejects role=admin outright (400) — admins are provisioned only.
      const res = await apiRegister({ name: 'Hacker', email: 'hacker@test.local', role: ROLES.ADMIN });
      expect(res.status).toBe(400);
    });

    it('rejects registration without privacy consent', async () => {
      const res = await apiRegister({ consent: false });
      expect(res.status).toBe(400);
    });

    it('rejects a duplicate email', async () => {
      const res = await apiRegister({ email: 'pema@test.local' });
      expect(res.status).toBe(409);
    });

    it('rejects weak validation payloads', async () => {
      const res = await apiRegister({ password: 'short', email: 'not-an-email' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials', async () => {
      const res = await apiLogin('pema@test.local');
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.user.email).toBe('pema@test.local');
    });

    it('returns a generic error for an unknown email', async () => {
      const res = await apiLogin('nobody@test.local');
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('returns a generic error for a wrong password', async () => {
      const res = await apiLogin('pema@test.local', 'WrongPassword1');
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('locks the account after 5 failed attempts, even with the right password', async () => {
      const res = await apiRegister({ name: 'Locky', email: 'locky@test.local' });
      const email = res.body.user.email;

      for (let i = 0; i < 5; i += 1) {
        const attempt = await apiLogin(email, 'WrongPassword1');
        expect(attempt.status).toBe(401);
      }

      // Now the correct password is also rejected while locked out.
      const locked = await apiLogin(email, TEST_PASSWORD);
      expect(locked.status).toBe(429);
      expect(locked.body.error.message).toMatch(/Too many failed attempts/i);
    });

    it('rejects suspended accounts', async () => {
      const res = await apiRegister({ name: 'Suspended', email: 'suspended@test.local' });
      await User.update({ status: 'suspended' }, { where: { id: res.body.user.id } });
      const login = await apiLogin('suspended@test.local');
      expect(login.status).toBe(403);
      expect(login.body.error.message).toMatch(/suspended/i);
    });
  });

  describe('POST /api/auth/refresh (rotation)', () => {
    it('issues a new access token and rotates the refresh token', async () => {
      const agent = request.agent(app);
      const loginRes = await agent.post('/api/auth/login').send({ email: 'pema@test.local', password: TEST_PASSWORD });
      const oldRefresh = cookieValue(loginRes);

      const refreshRes = await agent.post('/api/auth/refresh');
      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.accessToken).toBeTruthy();
      const newRefresh = cookieValue(refreshRes);
      expect(newRefresh).toBeTruthy();
      expect(newRefresh).not.toBe(oldRefresh);

      // Old (now revoked) token must no longer work.
      const replay = await request(app).post('/api/auth/refresh').set('Cookie', `${REFRESH_COOKIE}=${oldRefresh}`);
      expect(replay.status).toBe(401);
    });

    it('rejects a refresh without a cookie', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('revokes the refresh token so it cannot be reused', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/login').send({ email: 'pema@test.local', password: TEST_PASSWORD });
      const logout = await agent.post('/api/auth/logout');
      expect(logout.status).toBe(200);

      const refresh = await agent.post('/api/auth/refresh');
      expect(refresh.status).toBe(401);
    });
  });

  describe('Protected route enforcement', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/bookings');
      expect(res.status).toBe(401);
    });

    it('returns 401 for an invalid token', async () => {
      const res = await request(app).get('/api/bookings').set('Authorization', 'Bearer not.a.real.token');
      expect(res.status).toBe(401);
    });
  });
});
