// Shared fixtures + request helpers for the integration test-suite.
// The in-memory SQLite DB is created fresh per test file (see setup.js), so
// call resetDatabase() + seedBaseline() in a beforeAll at the top of each file.
import request from 'supertest';
import app from '../app.js';
import {
  sequelize,
  User,
  CaregiverProfile,
  PatientProfile,
  Service,
  CaregiverDocument,
  Booking,
  Payment,
  Review,
} from '../models/index.js';
import { SERVICE_CATALOGUE, ROLES, VERIFICATION_STATUS, DOC_TYPES } from '../config/constants.js';
import { toPaisa } from '../utils/money.js';

export { app, sequelize, User, CaregiverProfile, PatientProfile, Service, CaregiverDocument, Booking, Payment, Review };

export const TEST_PASSWORD = 'Password123';

export async function resetDatabase() {
  await sequelize.sync({ force: true });
}

export async function createServices() {
  for (const s of SERVICE_CATALOGUE) {
    // Idempotent — suites may call this more than once (seedBaseline does too).
    await Service.findOrCreate({ where: { name: s.name }, defaults: s });
  }
}

let seq = 0;

/** Create a user (with the matching profile row) directly via the models. */
export async function createUser({ role = ROLES.PATIENT, name, email, phone, password = TEST_PASSWORD, ...extra } = {}) {
  seq += 1;
  const user = await User.create({
    name: name || `${role}-test-${seq}`,
    email: email || `${role}.test${seq}@smartcare.local`,
    phone: phone || `98000000${String(seq).padStart(2, '0')}`,
    password,
    role,
    status: 'active',
    consent_accepted_at: new Date(),
    ...extra,
  });
  if (role === ROLES.CAREGIVER) await CaregiverProfile.create({ user_id: user.id });
  if (role === ROLES.PATIENT) await PatientProfile.create({ user_id: user.id });
  return user;
}

/** Verified caregiver with a realistic profile, ready to be booked. */
export async function createVerifiedCaregiver(overrides = {}) {
  const user = await createUser({ role: ROLES.CAREGIVER });
  const profile = await CaregiverProfile.findOne({ where: { user_id: user.id } });
  await profile.update({
    bio: 'Certified caregiver with hospital experience.',
    years_experience: 5,
    hourly_rate_paisa: toPaisa(500),
    verification_status: VERIFICATION_STATUS.VERIFIED,
    verified_by: 1,
    verified_at: new Date(),
    city: 'Kathmandu',
    serves_home: true,
    serves_hospital: true,
    is_available: true,
    ...overrides,
  });
  return user;
}

export async function createAdmin() {
  return createUser({ role: ROLES.ADMIN, name: 'Admin', email: 'admin@smartcare.local' });
}

export async function attachServices(userId, serviceIds) {
  const user = await User.findByPk(userId);
  await user.setServices(serviceIds);
}

/** Standalone baseline: admin + services + one verified caregiver. */
export async function seedBaseline() {
  await createServices();
  const admin = await createAdmin();
  const caregiver = await createVerifiedCaregiver();
  return { admin, caregiver };
}

// ── HTTP helpers ────────────────────────────────────────

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

/** Register via the API and return the parsed JSON body + response. */
export async function apiRegister(overrides = {}) {
  return request(app).post('/api/auth/register').send({
    name: 'API User',
    email: `api.${Date.now()}${Math.random().toString(36).slice(2, 6)}@test.local`,
    phone: '9800000000',
    password: TEST_PASSWORD,
    role: ROLES.PATIENT,
    consent: true,
    ...overrides,
  });
}

/** Login via the API and return the parsed JSON body + response. */
export async function apiLogin(email, password = TEST_PASSWORD) {
  return request(app).post('/api/auth/login').send({ email, password });
}

/** Convenience: register+login, returns { user, accessToken }. */
export async function registerAndLogin(overrides = {}) {
  const reg = await apiRegister(overrides);
  if (reg.status !== 201) throw new Error(`register failed: ${reg.status} ${JSON.stringify(reg.body)}`);
  const login = await apiLogin(reg.body.user.email);
  if (login.status !== 200) throw new Error(`login failed: ${login.status} ${JSON.stringify(login.body)}`);
  return login.body;
}

/** Login a user that was already created directly (via createUser/createAdmin). */
export async function loginOnly(email, password = TEST_PASSWORD) {
  const login = await apiLogin(email, password);
  if (login.status !== 200) throw new Error(`login failed: ${login.status} ${JSON.stringify(login.body)}`);
  return login.body;
}

/** Future ISO datetime helper for bookings. */
export function futureIso(hoursFromNow, minuteOffset = 0) {
  const d = new Date(Date.now() + hoursFromNow * 3600 * 1000);
  d.setMinutes(d.getMinutes() + minuteOffset);
  return d.toISOString();
}

/** Walk a booking through to COMPLETED using the API. Returns final response. */
export async function completeBooking({ patientToken, caregiverToken, caregiverId, serviceId, startHoursFromNow = 24, durationHours = 6 }) {
  const created = await request(app)
    .post('/api/bookings')
    .set(authHeader(patientToken))
    .send({
      caregiver_id: caregiverId,
      service_id: serviceId,
      location_type: 'home',
      address: 'Baneshwor, Kathmandu',
      start_datetime: futureIso(startHoursFromNow),
      end_datetime: futureIso(startHoursFromNow + durationHours),
    });
  const bookingId = created.body.booking.id;

  const accept = await request(app)
    .put(`/api/bookings/${bookingId}/status`)
    .set(authHeader(caregiverToken))
    .send({ action: 'accept' });

  const start = await request(app)
    .put(`/api/bookings/${bookingId}/status`)
    .set(authHeader(caregiverToken))
    .send({ action: 'start' });

  const complete = await request(app)
    .put(`/api/bookings/${bookingId}/status`)
    .set(authHeader(caregiverToken))
    .send({ action: 'complete' });

  return { bookingId, created, accept, start, complete };
}
