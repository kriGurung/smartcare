import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import {
  app,
  resetDatabase,
  createServices,
  createUser,
  createVerifiedCaregiver,
  createAdmin,
  attachServices,
  registerAndLogin,
  loginOnly,
  authHeader,
  futureIso,
  Service,
} from './helpers.js';
import { ROLES, VERIFICATION_STATUS } from '../config/constants.js';

describe('Role-based access control & data scoping', () => {
  let patientAuth;
  let caregiverAuth;
  let adminAuth;
  let otherPatientAuth;
  let caregiver;
  let otherCaregiver;
  let serviceId;

  beforeAll(async () => {
    await resetDatabase();
    await createServices();
    const services = await Service.findAll();
    serviceId = services[0].id;

    const admin = await createAdmin();
    caregiver = await createVerifiedCaregiver({ city: 'Kathmandu', hourlyRatePaisa: undefined });
    await attachServices(caregiver.id, [serviceId]);
    otherCaregiver = await createVerifiedCaregiver({ city: 'Pokhara', serves_home: false, serves_hospital: true });

    patientAuth = await registerAndLogin({ name: 'Patient A' });
    otherPatientAuth = await registerAndLogin({ name: 'Patient B' });
    caregiverAuth = await loginOnly(caregiver.email);
    adminAuth = await loginOnly(admin.email);
  });

  describe('public browsing', () => {
    it('returns only VERIFIED caregivers in search', async () => {
      const pending = await createUser({ role: ROLES.CAREGIVER }); // never verified
      const res = await request(app).get('/api/caregivers');
      expect(res.status).toBe(200);
      const ids = res.body.caregivers.map((c) => c.id);
      expect(ids).toContain(caregiver.id);
      expect(ids).toContain(otherCaregiver.id);
      expect(ids).not.toContain(pending.id);
    });

    it('filters by city', async () => {
      const res = await request(app).get('/api/caregivers').query({ city: 'Pokhara' });
      expect(res.status).toBe(200);
      expect(res.body.caregivers).toHaveLength(1);
      expect(res.body.caregivers[0].city).toBe('Pokhara');
    });

    it('filters by home/hospital location type', async () => {
      const home = await request(app).get('/api/caregivers').query({ location: 'home' });
      expect(home.body.caregivers.some((c) => c.id === otherCaregiver.id)).toBe(false);
      const hospital = await request(app).get('/api/caregivers').query({ location: 'hospital' });
      expect(hospital.body.caregivers.some((c) => c.id === otherCaregiver.id)).toBe(true);
    });

    it('filters by service offered', async () => {
      const res = await request(app).get('/api/caregivers').query({ service: serviceId });
      expect(res.status).toBe(200);
      expect(res.body.caregivers.every((c) => c.services.some((s) => s.id === serviceId))).toBe(true);
    });

    it('returns 404 for a pending caregiver profile', async () => {
      const pending = await createUser({ role: ROLES.CAREGIVER });
      const res = await request(app).get(`/api/caregivers/${pending.id}`);
      expect(res.status).toBe(404);
    });

    it('returns a full public profile for a verified caregiver', async () => {
      const res = await request(app).get(`/api/caregivers/${caregiver.id}`);
      expect(res.status).toBe(200);
      expect(res.body.caregiver.verificationStatus).toBe(VERIFICATION_STATUS.VERIFIED);
      expect(res.body.caregiver.verification_checklist).toBeDefined();
      expect(res.body.caregiver.availability).toBeDefined();
    });
  });

  describe('admin-only endpoints', () => {
    it('rejects patients with 403', async () => {
      const res = await request(app).get('/api/admin/users').set(authHeader(patientAuth.accessToken));
      expect(res.status).toBe(403);
    });

    it('rejects caregivers with 403', async () => {
      const res = await request(app).get('/api/admin/caregivers/pending').set(authHeader(caregiverAuth.accessToken));
      expect(res.status).toBe(403);
    });

    it('rejects anonymous users with 401', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.status).toBe(401);
    });

    it('allows admins', async () => {
      const res = await request(app).get('/api/admin/users').set(authHeader(adminAuth.accessToken));
      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
    });
  });

  describe('caregiver self-scoping', () => {
    it('caregiver can update their OWN profile', async () => {
      const res = await request(app)
        .put(`/api/caregivers/${caregiver.id}`)
        .set(authHeader(caregiverAuth.accessToken))
        .send({ bio: 'Updated bio', city: 'Bhaktapur' });
      expect(res.status).toBe(200);
      expect(res.body.caregiver.city).toBe('Bhaktapur');
    });

    it('caregiver cannot update ANOTHER caregiver’s profile (403)', async () => {
      const res = await request(app)
        .put(`/api/caregivers/${otherCaregiver.id}`)
        .set(authHeader(caregiverAuth.accessToken))
        .send({ bio: 'sneaky edit' });
      expect(res.status).toBe(403);
    });

    it('a patient cannot use caregiver self-endpoints (403)', async () => {
      const res = await request(app)
        .put(`/api/caregivers/${caregiver.id}`)
        .set(authHeader(patientAuth.accessToken))
        .send({ bio: 'x' });
      expect(res.status).toBe(403);
    });
  });

  describe('booking ownership (anti-IDOR)', () => {
    let bookingId;

    beforeAll(async () => {
      const created = await request(app)
        .post('/api/bookings')
        .set(authHeader(patientAuth.accessToken))
        .send({
          caregiver_id: caregiver.id,
          location_type: 'home',
          address: 'Baneshwor',
          start_datetime: futureIso(24),
          end_datetime: futureIso(30),
        });
      bookingId = created.body.booking.id;
    });

    it('owner can read their booking', async () => {
      const res = await request(app).get(`/api/bookings/${bookingId}`).set(authHeader(patientAuth.accessToken));
      expect(res.status).toBe(200);
    });

    it('another patient cannot read it (404, not 403 — no existence leak)', async () => {
      const res = await request(app).get(`/api/bookings/${bookingId}`).set(authHeader(otherPatientAuth.accessToken));
      expect(res.status).toBe(404);
    });

    it('list is scoped — other patient sees only their own', async () => {
      const res = await request(app).get('/api/bookings').set(authHeader(otherPatientAuth.accessToken));
      expect(res.status).toBe(200);
      expect(res.body.bookings.some((b) => b.id === bookingId)).toBe(false);
    });

    it('caregiver involved in the booking can read it', async () => {
      const res = await request(app).get(`/api/bookings/${bookingId}`).set(authHeader(caregiverAuth.accessToken));
      expect(res.status).toBe(200);
    });
  });
});
