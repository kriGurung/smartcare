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
  CaregiverProfile,
  Service,
} from './helpers.js';
import { ROLES, BOOKING_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '../config/constants.js';

describe('Booking → Payment → Review lifecycle', () => {
  let patient;
  let caregiver;
  let admin;
  let pendingCaregiver;
  let caregiverAuth;
  let pendingCaregiverAuth;
  let adminAuth;
  let serviceId;
  const RATE_PAISA = 50000; // Rs. 500/hr

  beforeAll(async () => {
    await resetDatabase();
    await createServices();
    const services = await Service.findAll();
    serviceId = services[0].id;

    const baseline = await seedBaseline();
    admin = baseline.admin;
    caregiver = await createVerifiedCaregiver({ city: 'Lalitpur', serves_home: true, serves_hospital: false });
    await attachServices(caregiver.id, [serviceId]);
    pendingCaregiver = await createUser({ role: ROLES.CAREGIVER });

    patient = await registerAndLogin({ name: 'Patient One' });
    caregiverAuth = await loginOnly(caregiver.email);
    pendingCaregiverAuth = await loginOnly(pendingCaregiver.email);
    adminAuth = await loginOnly(admin.email);
  });

  it('creates a pending booking with correct integer-paisa pricing', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set(authHeader(patient.accessToken))
      .send({
        caregiver_id: caregiver.id,
        service_id: serviceId,
        location_type: 'home',
        address: 'Patan Dhoka, Lalitpur',
        start_datetime: futureIso(24),
        end_datetime: futureIso(30), // 6 hours
        patient_note: 'Needs help with mobility',
      });

    expect(res.status).toBe(201);
    expect(res.body.booking.status).toBe(BOOKING_STATUS.PENDING);
    expect(res.body.booking.hourly_rate_paisa).toBe(RATE_PAISA);
    expect(res.body.booking.hours).toBe(6);
    expect(res.body.booking.total_amount_paisa).toBe(6 * RATE_PAISA);
    expect(res.body.booking.commission_paisa).toBe(Math.round((6 * RATE_PAISA * 10) / 100));
    expect(res.body.booking.caregiver_earning_paisa).toBe(
      6 * RATE_PAISA - Math.round((6 * RATE_PAISA * 10) / 100)
    );
  });

  it('rejects booking an unverified caregiver', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set(authHeader(patient.accessToken))
      .send({
        caregiver_id: pendingCaregiver.id,
        location_type: 'home',
        address: 'Koteshwor, Kathmandu',
        start_datetime: futureIso(24),
        end_datetime: futureIso(30),
      });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/not available for booking/i);
  });

  it('rejects a caregiver who does not serve the requested location type', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set(authHeader(patient.accessToken))
      .send({
        caregiver_id: caregiver.id, // serves_home only
        location_type: 'hospital',
        address: 'Teaching Hospital',
        hospital_name: 'TUTH',
        start_datetime: futureIso(24),
        end_datetime: futureIso(30),
      });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/hospital/i);
  });

  it('rejects past or inverted time ranges', async () => {
    const past = await request(app)
      .post('/api/bookings')
      .set(authHeader(patient.accessToken))
      .send({
        caregiver_id: caregiver.id,
        location_type: 'home',
        address: 'Baneshwor',
        start_datetime: futureIso(-2),
        end_datetime: futureIso(4),
      });
    expect(past.status).toBe(400);

    const inverted = await request(app)
      .post('/api/bookings')
      .set(authHeader(patient.accessToken))
      .send({
        caregiver_id: caregiver.id,
        location_type: 'home',
        address: 'Baneshwor',
        start_datetime: futureIso(24),
        end_datetime: futureIso(23),
      });
    expect(inverted.status).toBe(400);
  });

  describe('status transitions', () => {
    let bookingId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set(authHeader(patient.accessToken))
        .send({
          caregiver_id: caregiver.id,
          service_id: serviceId,
          location_type: 'home',
          address: 'Jhamsikhel, Lalitpur',
          start_datetime: futureIso(48),
          end_datetime: futureIso(54),
        });
      bookingId = res.body.booking.id;
    });

    it('caregiver accepts → confirmed', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set(authHeader(caregiverAuth.accessToken))
        .send({ action: 'accept' });
      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe(BOOKING_STATUS.CONFIRMED);
    });

    it('patient cannot accept their own booking (RBAC on transition)', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set(authHeader(patient.accessToken))
        .send({ action: 'accept' });
      expect(res.status).toBe(403);
    });

    it('caregiver starts → in_progress', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set(authHeader(caregiverAuth.accessToken))
        .send({ action: 'start' });
      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe(BOOKING_STATUS.IN_PROGRESS);
    });

    it('caregiver completes → completed', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set(authHeader(caregiverAuth.accessToken))
        .send({ action: 'complete' });
      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe(BOOKING_STATUS.COMPLETED);
    });

    it('a completed booking cannot be completed again (invalid transition)', async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set(authHeader(caregiverAuth.accessToken))
        .send({ action: 'complete' });
      expect(res.status).toBe(400);
    });

    it('caregiver can add a care log to a completed visit', async () => {
      const res = await request(app)
        .post(`/api/bookings/${bookingId}/care-logs`)
        .set(authHeader(caregiverAuth.accessToken))
        .send({ tasks_completed: 'Morning care, medication reminders', observations: 'Patient was cheerful', patient_mood: 'good' });
      expect(res.status).toBe(201);
      expect(res.body.careLog.tasks_completed).toMatch(/medication/);
    });

    it('patient can read care logs for their booking', async () => {
      const res = await request(app).get(`/api/bookings/${bookingId}/care-logs`).set(authHeader(patient.accessToken));
      expect(res.status).toBe(200);
      expect(res.body.careLogs.length).toBe(1);
    });
  });

  describe('payments', () => {
    let bookingId;
    let paidRef;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set(authHeader(patient.accessToken))
        .send({
          caregiver_id: caregiver.id,
          service_id: serviceId,
          location_type: 'home',
          address: 'Baluwatar, Kathmandu',
          start_datetime: futureIso(72),
          end_datetime: futureIso(78),
        });
      bookingId = res.body.booking.id;
    });

    it('initiates a mock eSewa checkout for the booking amount', async () => {
      const res = await request(app)
        .post('/api/payments/initiate')
        .set(authHeader(patient.accessToken))
        .send({ booking_id: bookingId, method: PAYMENT_METHODS.ESEWA });
      expect(res.status).toBe(200);
      expect(res.body.mode).toBe('sandbox');
      expect(res.body.checkoutUrl).toContain('/api/payments/sandbox/checkout');
      expect(res.body.payment.amountPaisa).toBe(6 * RATE_PAISA);
    });

    it('returns manual instructions for cash payments', async () => {
      const res = await request(app)
        .post('/api/payments/initiate')
        .set(authHeader(patient.accessToken))
        .send({ booking_id: bookingId, method: PAYMENT_METHODS.CASH });
      expect(res.status).toBe(200);
      expect(res.body.mode).toBe('manual');
      expect(res.body.instructions).toMatch(/cash/i);
    });

    it('a patient cannot pay for someone else’s booking', async () => {
      const other = await registerAndLogin({ name: 'Other Patient' });
      const res = await request(app)
        .post('/api/payments/initiate')
        .set(authHeader(other.accessToken))
        .send({ booking_id: bookingId, method: PAYMENT_METHODS.ESEWA });
      expect(res.status).toBe(403);
    });

    it('finalizes a successful sandbox payment', async () => {
      const init = await request(app)
        .post('/api/payments/initiate')
        .set(authHeader(patient.accessToken))
        .send({ booking_id: bookingId, method: PAYMENT_METHODS.ESEWA });
      const ref = init.body.payment.transactionRef;

      const verifyRes = await request(app)
        .post('/api/payments/verify')
        .set(authHeader(patient.accessToken))
        .send({ transaction_ref: ref, method: PAYMENT_METHODS.ESEWA, status: 'success' });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.payment.status).toBe(PAYMENT_STATUS.PAID);
      paidRef = ref;
    });

    it('cannot pay twice for the same booking', async () => {
      const res = await request(app)
        .post('/api/payments/initiate')
        .set(authHeader(patient.accessToken))
        .send({ booking_id: bookingId, method: PAYMENT_METHODS.ESEWA });
      expect(res.status).toBe(409);
    });

    it('is idempotent — verifying a paid payment returns alreadyPaid', async () => {
      const again = await request(app)
        .post('/api/payments/verify')
        .set(authHeader(patient.accessToken))
        .send({ transaction_ref: paidRef, method: PAYMENT_METHODS.ESEWA, status: 'success' });
      expect(again.status).toBe(200);
      expect(again.body.alreadyPaid).toBe(true);
    });

    it('marks a failed gateway callback as failed', async () => {
      const created = await request(app)
        .post('/api/bookings')
        .set(authHeader(patient.accessToken))
        .send({
          caregiver_id: caregiver.id,
          service_id: serviceId,
          location_type: 'home',
          address: 'Naxal, Kathmandu',
          start_datetime: futureIso(80),
          end_datetime: futureIso(86),
        });
      const failBookingId = created.body.booking.id;
      const init = await request(app)
        .post('/api/payments/initiate')
        .set(authHeader(patient.accessToken))
        .send({ booking_id: failBookingId, method: PAYMENT_METHODS.ESEWA });
      const ref = init.body.payment.transactionRef;

      const fail = await request(app)
        .post('/api/payments/verify')
        .set(authHeader(patient.accessToken))
        .send({ transaction_ref: ref, method: PAYMENT_METHODS.ESEWA, status: 'failed' });
      expect(fail.status).toBe(400);
      expect(fail.body.payment.status).toBe(PAYMENT_STATUS.FAILED);
    });
  });

  describe('reviews', () => {
    let completedBookingId;

    beforeAll(async () => {
      const created = await request(app)
        .post('/api/bookings')
        .set(authHeader(patient.accessToken))
        .send({
          caregiver_id: caregiver.id,
          service_id: serviceId,
          location_type: 'home',
          address: 'Maharajgunj, Kathmandu',
          start_datetime: futureIso(96),
          end_datetime: futureIso(100),
        });
      const id = created.body.booking.id;
      for (const action of ['accept', 'start', 'complete']) {
        await request(app).put(`/api/bookings/${id}/status`).set(authHeader(caregiverAuth.accessToken)).send({ action });
      }
      completedBookingId = id;
    });

    it('cannot review a booking that is not completed', async () => {
      const created = await request(app)
        .post('/api/bookings')
        .set(authHeader(patient.accessToken))
        .send({
          caregiver_id: caregiver.id,
          service_id: serviceId,
          location_type: 'home',
          address: 'Sankhamul, Kathmandu',
          start_datetime: futureIso(120),
          end_datetime: futureIso(124),
        });
      const id = created.body.booking.id;
      const res = await request(app)
        .post('/api/reviews')
        .set(authHeader(patient.accessToken))
        .send({ booking_id: id, rating: 5 });
      expect(res.status).toBe(400);
    });

    it('creates a review and recomputes the caregiver aggregate rating', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set(authHeader(patient.accessToken))
        .send({ booking_id: completedBookingId, rating: 5, punctuality: 5, care_quality: 4, communication: 5, comment: 'Excellent service' });
      expect(res.status).toBe(201);
      expect(res.body.review.rating).toBe(5);

      const profile = await CaregiverProfile.findOne({ where: { user_id: caregiver.id } });
      expect(profile.total_reviews).toBe(1);
      expect(Number(profile.avg_rating)).toBe(5);
    });

    it('rejects a duplicate review for the same booking', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set(authHeader(patient.accessToken))
        .send({ booking_id: completedBookingId, rating: 3 });
      expect(res.status).toBe(409);
    });

    it('rejects rating outside 1–5', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set(authHeader(patient.accessToken))
        .send({ booking_id: completedBookingId, rating: 7 });
      expect(res.status).toBe(400);
    });
  });
});
