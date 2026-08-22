import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import {
  app,
  resetDatabase,
  seedBaseline,
  createServices,
  createUser,
  createVerifiedCaregiver,
  attachServices,
  registerAndLogin,
  loginOnly,
  authHeader,
  futureIso,
  completeBooking,
  CaregiverProfile,
  Service,
  Booking,
  Payment,
} from './helpers.js';
import { ROLES, BOOKING_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '../config/constants.js';
import { toPaisa } from '../utils/money.js';

describe('New features: reschedule, cancel-refund, pagination, reports, profile-completion', () => {
  let patient;
  let caregiver;
  let admin;
  let caregiverAuth;
  let adminAuth;
  let serviceId;
  const RATE_PAISA = toPaisa(500);

  beforeAll(async () => {
    await resetDatabase();
    await createServices();
    const services = await Service.findAll();
    serviceId = services[0].id;

    const baseline = await seedBaseline();
    admin = baseline.admin;
    caregiver = await createVerifiedCaregiver({ city: 'Kathmandu', serves_home: true });
    await attachServices(caregiver.id, [serviceId]);

    patient = await registerAndLogin({ name: 'Test Patient' });
    caregiverAuth = await loginOnly(caregiver.email);
    adminAuth = await loginOnly(admin.email);
  });

  // ─── Cancel auto-refund ────────────────────────────────
  describe('cancel auto-refund', () => {
    let bookingId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set(authHeader(patient.accessToken))
        .send({
          caregiver_id: caregiver.id,
          service_id: serviceId,
          location_type: 'home',
          address: 'Test cancel refund address',
          start_datetime: futureIso(24),
          end_datetime: futureIso(30),
        });
      bookingId = res.body.booking.id;

      // Accept + initiate payment + verify → PAID
      await request(app).put(`/api/bookings/${bookingId}/status`).set(authHeader(caregiverAuth.accessToken)).send({ action: 'accept' });
      const init = await request(app)
        .post('/api/payments/initiate')
        .set(authHeader(patient.accessToken))
        .send({ booking_id: bookingId, method: PAYMENT_METHODS.ESEWA });
      await request(app)
        .post('/api/payments/verify')
        .set(authHeader(patient.accessToken))
        .send({ transaction_ref: init.body.payment.transactionRef, method: PAYMENT_METHODS.ESEWA, status: 'success' });
    });

    it('auto-refunds paid payments when patient cancels a confirmed booking', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set(authHeader(patient.accessToken))
        .send({ action: 'cancel' });
      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe(BOOKING_STATUS.CANCELLED);

      const payment = await Payment.findOne({ where: { booking_id: bookingId } });
      expect(payment.status).toBe(PAYMENT_STATUS.REFUNDED);
      expect(payment.refunded_at).not.toBeNull();
    });
  });

  // ─── Reschedule ────────────────────────────────────────
  describe('reschedule', () => {
    let bookingId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set(authHeader(patient.accessToken))
        .send({
          caregiver_id: caregiver.id,
          service_id: serviceId,
          location_type: 'home',
          address: 'Test reschedule address',
          start_datetime: futureIso(96),
          end_datetime: futureIso(102),
        });
      bookingId = res.body.booking.id;
    });

    it('patient can reschedule a confirmed booking with new dates', async () => {
      const newStart = futureIso(120);
      const newEnd = futureIso(126); // still 6 hours
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set(authHeader(patient.accessToken))
        .send({ action: 'reschedule', start_datetime: newStart, end_datetime: newEnd });
      expect(res.status).toBe(200);
      expect(new Date(res.body.booking.start_datetime).toISOString().slice(0, 16)).toBe(new Date(newStart).toISOString().slice(0, 16));
    });

    it('caregiver cannot reschedule (wrong role)', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set(authHeader(caregiverAuth.accessToken))
        .send({ action: 'reschedule', start_datetime: futureIso(130), end_datetime: futureIso(136) });
      expect(res.status).toBe(403);
    });

    it('rejects reschedule with past dates', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set(authHeader(patient.accessToken))
        .send({ action: 'reschedule', start_datetime: futureIso(-2), end_datetime: futureIso(4) });
      expect(res.status).toBe(400);
    });

    it('rejects reschedule with end before start', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set(authHeader(patient.accessToken))
        .send({ action: 'reschedule', start_datetime: futureIso(130), end_datetime: futureIso(129) });
      expect(res.status).toBe(400);
    });
  });

  // ─── Search pagination ─────────────────────────────────
  describe('search pagination', () => {
    it('returns paginated results with total and totalPages', async () => {
      const res = await request(app).get('/api/caregivers?page=1&limit=1');
      expect(res.status).toBe(200);
      expect(res.body.caregivers).toBeDefined();
      expect(typeof res.body.total).toBe('number');
      expect(typeof res.body.page).toBe('number');
      expect(typeof res.body.totalPages).toBe('number');
      expect(res.body.caregivers.length).toBeLessThanOrEqual(1);
    });

    it('returns empty page beyond available results', async () => {
      const res = await request(app).get('/api/caregivers?page=999&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.caregivers.length).toBe(0);
    });
  });

  // ─── Availability-by-date filter ───────────────────────
  describe('availability-by-date', () => {
    it('filters caregivers by availability on a given date', async () => {
      // Use a date that falls on a weekday (day_of_week 1 = Monday, etc.)
      const d = new Date();
      d.setDate(d.getDate() + 7); // ensure future
      const dayOfWeek = d.getDay();
      const isoDate = d.toISOString().slice(0, 10);

      // Set availability for the caregiver on that day_of_week
      const profile = await CaregiverProfile.findOne({ where: { user_id: caregiver.id } });
      const { CaregiverAvailability } = await import('../models/index.js');
      await CaregiverAvailability.destroy({ where: { caregiver_id: caregiver.id } });
      await CaregiverAvailability.create({ caregiver_id: caregiver.id, day_of_week: dayOfWeek, start_time: '09:00', end_time: '17:00' });

      const res = await request(app).get(`/api/caregivers?date=${isoDate}`);
      expect(res.status).toBe(200);
      const ids = res.body.caregivers.map((c) => c.id);
      expect(ids).toContain(caregiver.id);
    });
  });

  // ─── Top caregivers report ─────────────────────────────
  describe('top caregivers report', () => {
    it('returns top caregivers for admin', async () => {
      const res = await request(app)
        .get('/api/admin/reports/top-caregivers')
        .set(authHeader(adminAuth.accessToken));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.topCaregivers)).toBe(true);
    });

    it('rejects non-admin access', async () => {
      const res = await request(app)
        .get('/api/admin/reports/top-caregivers')
        .set(authHeader(patient.accessToken));
      expect(res.status).toBe(403);
    });
  });

  // ─── Profile completion ────────────────────────────────
  describe('profile completion', () => {
    it('returns profile_completion for patient', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set(authHeader(patient.accessToken));
      expect(res.status).toBe(200);
      expect(typeof res.body.user.profile_completion).toBe('number');
      expect(res.body.user.profile_completion).toBeGreaterThanOrEqual(0);
      expect(res.body.user.profile_completion).toBeLessThanOrEqual(100);
    });

    it('returns profile_completion for caregiver', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set(authHeader(caregiverAuth.accessToken));
      expect(res.status).toBe(200);
      expect(typeof res.body.user.profile_completion).toBe('number');
    });
  });

  // ─── Report/flag user ──────────────────────────────────
  describe('report/flag user', () => {
    it('patient can report a caregiver', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set(authHeader(patient.accessToken))
        .send({ reported_id: caregiver.id, reason: 'safety_concern', description: 'Testing report feature' });
      expect(res.status).toBe(201);
      expect(res.body.report.reason).toBe('safety_concern');
      expect(res.body.report.status).toBe('pending');
    });

    it('cannot report yourself', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set(authHeader(patient.accessToken))
        .send({ reported_id: patient.user.id, reason: 'other' });
      expect(res.status).toBe(400);
    });

    it('admin can list user reports', async () => {
      const res = await request(app)
        .get('/api/reports/admin')
        .set(authHeader(adminAuth.accessToken));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.reports)).toBe(true);
      expect(res.body.reports.length).toBeGreaterThanOrEqual(1);
    });

    it('admin can review a user report', async () => {
      const list = await request(app)
        .get('/api/reports/admin')
        .set(authHeader(adminAuth.accessToken));
      const reportId = list.body.reports[0].id;
      const res = await request(app)
        .put(`/api/reports/admin/${reportId}`)
        .set(authHeader(adminAuth.accessToken))
        .send({ status: 'reviewed' });
      expect(res.status).toBe(200);
      expect(res.body.report.status).toBe('reviewed');
    });

    it('non-admin cannot list reports', async () => {
      const res = await request(app)
        .get('/api/reports/admin')
        .set(authHeader(patient.accessToken));
      expect(res.status).toBe(403);
    });
  });
});
