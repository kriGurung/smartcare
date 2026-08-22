import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { ensureDatabaseExists, testConnection, sequelize } from '../config/database.js';
import env from '../config/env.js';
import logger from './logger.js';
import { toPaisa } from './money.js';
import { recomputeCaregiverRatings } from '../controllers/reviewController.js';
import {
  ROLES,
  USER_STATUS,
  VERIFICATION_STATUS,
  DOC_TYPES,
  DOC_STATUS,
  LOCATION_TYPE,
  BOOKING_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  SERVICE_CATALOGUE,
  DEFAULT_COMMISSION_PERCENT,
} from '../config/constants.js';
import {
  User,
  CaregiverProfile,
  PatientProfile,
  Service,
  CaregiverDocument,
  CaregiverAvailability,
  Booking,
  Payment,
  Review,
  Setting,
} from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEMO_PASSWORD = 'Password123';

// A tiny valid PNG (blue square) used as a placeholder "scanned document".
const PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAP0lEQVR42u3OMQEAAAgDoK1/aM3g4QcJqJlk1WoBAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIfBpYlQFBGr9U0AAAAABJRU5ErkJggg==';

function writePlaceholderDoc(filename) {
  const dir = path.resolve(__dirname, '../../', env.upload.dir, 'documents');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), Buffer.from(PLACEHOLDER_PNG_BASE64, 'base64'));
}

const CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara'];

const CAREGIVERS = [
  { name: 'Sita Sharma', email: 'sita@smartcare.local', phone: '9801000001', city: 'Kathmandu', gender: 'female', exp: 8, rate: 350, bio: 'Compassionate elder-care specialist with 8 years supporting seniors at home. Trained in mobility assistance and medication reminders.', langs: 'Nepali, English', verified: true, services: ['Elderly Care', 'Medication Management', 'Palliative Care'] },
  { name: 'Ram Bahadur Thapa', email: 'ram@smartcare.local', phone: '9801000002', city: 'Lalitpur', gender: 'male', exp: 5, rate: 300, bio: 'Experienced hospital sitter and post-surgery care provider. Calm, reliable, and available for night shifts.', langs: 'Nepali, English, Hindi', verified: true, services: ['Hospital Sitter', 'Post-Surgery Care'] },
  { name: 'Anita Gurung', email: 'anita@smartcare.local', phone: '9801000003', city: 'Kathmandu', gender: 'female', exp: 6, rate: 400, bio: 'Certified maternity and newborn care assistant. Gentle support for new mothers and infants.', langs: 'Nepali, English', verified: true, services: ['Maternity & Newborn', 'Elderly Care'] },
  { name: 'Bikash Rai', email: 'bikash@smartcare.local', phone: '9801000004', city: 'Bhaktapur', gender: 'male', exp: 3, rate: 280, bio: 'Physiotherapy assistant helping patients follow prescribed exercises and regain independence.', langs: 'Nepali, English', verified: true, services: ['Physiotherapy Assist', 'Disability Support'] },
  { name: 'Puja Karki', email: 'puja@smartcare.local', phone: '9801000005', city: 'Pokhara', gender: 'female', exp: 4, rate: 320, bio: 'Warm and patient disability support worker with first-aid certification.', langs: 'Nepali', verified: true, services: ['Disability Support', 'Elderly Care'] },
  // Two awaiting verification — to demo the admin queue.
  { name: 'Deepak Shrestha', email: 'deepak@smartcare.local', phone: '9801000006', city: 'Kathmandu', gender: 'male', exp: 2, rate: 260, bio: 'Motivated caregiver seeking to help elderly clients. Recently completed a caregiving course.', langs: 'Nepali, English', verified: false, services: ['Elderly Care'] },
  { name: 'Kabita Magar', email: 'kabita@smartcare.local', phone: '9801000007', city: 'Lalitpur', gender: 'female', exp: 7, rate: 380, bio: 'Palliative and post-surgery care with a focus on comfort and dignity.', langs: 'Nepali, English', verified: false, services: ['Palliative Care', 'Post-Surgery Care'] },
];

const PATIENTS = [
  { name: 'Hari Prasad', email: 'hari@smartcare.local', phone: '9812000001', city: 'Kathmandu', address: 'Baneshwor, Kathmandu', emergency: '9812111111' },
  { name: 'Gita Devi', email: 'gita@smartcare.local', phone: '9812000002', city: 'Lalitpur', address: 'Pulchowk, Lalitpur', emergency: '9812222222' },
  { name: 'Suresh Adhikari', email: 'suresh@smartcare.local', phone: '9812000003', city: 'Kathmandu', address: 'Kalanki, Kathmandu', emergency: '9812333333' },
];

function daysFromNow(days, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

export async function runSeed({ silent = false } = {}) {
  const log = (...a) => (silent ? null : console.log(...a));

  // Services
  const services = {};
  for (const s of SERVICE_CATALOGUE) {
    const [svc] = await Service.findOrCreate({ where: { name: s.name }, defaults: { description: s.description } });
    services[s.name] = svc;
  }
  log(`✔ ${Object.keys(services).length} services`);

  // Settings
  await Setting.upsert({ key: 'commission_percent', value: DEFAULT_COMMISSION_PERCENT });
  await Setting.upsert({ key: 'banner', value: 'Welcome to SmartCare — every caregiver is verified before they appear here.' });

  // Admin
  await User.create({
    name: 'SmartCare Admin',
    email: 'admin@smartcare.local',
    phone: '9800000000',
    password: DEMO_PASSWORD,
    role: ROLES.ADMIN,
    status: USER_STATUS.ACTIVE,
    consent_accepted_at: new Date(),
  });
  log('✔ admin account');

  // Caregivers
  const caregiverUsers = {};
  for (const c of CAREGIVERS) {
    const user = await User.create({
      name: c.name,
      email: c.email,
      phone: c.phone,
      password: DEMO_PASSWORD,
      role: ROLES.CAREGIVER,
      status: USER_STATUS.ACTIVE,
      consent_accepted_at: new Date(),
    });
    await CaregiverProfile.create({
      user_id: user.id,
      bio: c.bio,
      years_experience: c.exp,
      hourly_rate_paisa: toPaisa(c.rate),
      city: c.city,
      gender: c.gender,
      languages: c.langs,
      serves_home: true,
      serves_hospital: c.services.some((s) => ['Hospital Sitter', 'Post-Surgery Care', 'Palliative Care'].includes(s)),
      verification_status: c.verified ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.PENDING,
      verified_at: c.verified ? new Date() : null,
    });
    await user.setServices(c.services.map((n) => services[n].id));

    // Availability: Sun–Fri, two common shift patterns.
    const slots = [];
    for (let day = 0; day <= 5; day++) {
      slots.push({ caregiver_id: user.id, day_of_week: day, start_time: '08:00', end_time: '14:00', is_recurring: true });
      slots.push({ caregiver_id: user.id, day_of_week: day, start_time: '15:00', end_time: '20:00', is_recurring: true });
    }
    await CaregiverAvailability.bulkCreate(slots);

    // Documents
    for (const dt of [DOC_TYPES.CITIZENSHIP, DOC_TYPES.CERTIFICATE, DOC_TYPES.POLICE_REPORT]) {
      const filename = `seed_${user.id}_${dt}.png`;
      writePlaceholderDoc(filename);
      await CaregiverDocument.create({
        caregiver_id: user.id,
        doc_type: dt,
        file_path: filename,
        original_name: `${dt}.png`,
        mime_type: 'image/png',
        status: c.verified ? DOC_STATUS.APPROVED : DOC_STATUS.PENDING,
      });
    }
    caregiverUsers[c.email] = user;
  }
  log(`✔ ${CAREGIVERS.length} caregivers (5 verified, 2 pending)`);

  // Patients
  const patientUsers = {};
  for (const p of PATIENTS) {
    const user = await User.create({
      name: p.name,
      email: p.email,
      phone: p.phone,
      password: DEMO_PASSWORD,
      role: ROLES.PATIENT,
      status: USER_STATUS.ACTIVE,
      consent_accepted_at: new Date(),
    });
    await PatientProfile.create({
      user_id: user.id,
      address: p.address,
      city: p.city,
      emergency_contact: p.emergency,
      notes: 'Prefers a caregiver who speaks Nepali.',
    });
    patientUsers[p.email] = user;
  }
  log(`✔ ${PATIENTS.length} patients`);

  // Bookings across statuses
  const commissionPct = DEFAULT_COMMISSION_PERCENT;
  const sita = caregiverUsers['sita@smartcare.local'];
  const ram = caregiverUsers['ram@smartcare.local'];
  const anita = caregiverUsers['anita@smartcare.local'];
  const hari = patientUsers['hari@smartcare.local'];
  const gita = patientUsers['gita@smartcare.local'];

  async function makeBooking({ patient, caregiver, serviceName, locType, address, start, end, status }) {
    const profile = await CaregiverProfile.findOne({ where: { user_id: caregiver.id } });
    const hours = Math.round(((end - start) / 3600000) * 100) / 100;
    const rate = profile.hourly_rate_paisa;
    const total = Math.round(hours * rate);
    const commission = Math.round((total * commissionPct) / 100);
    return Booking.create({
      patient_id: patient.id,
      caregiver_id: caregiver.id,
      service_id: services[serviceName].id,
      location_type: locType,
      address,
      start_datetime: start,
      end_datetime: end,
      hours,
      hourly_rate_paisa: rate,
      total_amount_paisa: total,
      commission_paisa: commission,
      caregiver_earning_paisa: total - commission,
      status,
    });
  }

  const completed1 = await makeBooking({ patient: hari, caregiver: sita, serviceName: 'Elderly Care', locType: LOCATION_TYPE.HOME, address: 'Baneshwor, Kathmandu', start: daysFromNow(-10, 8), end: daysFromNow(-10, 14), status: BOOKING_STATUS.COMPLETED });
  const completed2 = await makeBooking({ patient: gita, caregiver: ram, serviceName: 'Hospital Sitter', locType: LOCATION_TYPE.HOSPITAL, address: 'Patan Hospital, Lalitpur', start: daysFromNow(-5, 9), end: daysFromNow(-5, 17), status: BOOKING_STATUS.COMPLETED });
  const completed3 = await makeBooking({ patient: hari, caregiver: anita, serviceName: 'Maternity & Newborn', locType: LOCATION_TYPE.HOME, address: 'Baneshwor, Kathmandu', start: daysFromNow(-3, 10), end: daysFromNow(-3, 15), status: BOOKING_STATUS.COMPLETED });
  const confirmed = await makeBooking({ patient: gita, caregiver: sita, serviceName: 'Palliative Care', locType: LOCATION_TYPE.HOME, address: 'Pulchowk, Lalitpur', start: daysFromNow(2, 9), end: daysFromNow(2, 13), status: BOOKING_STATUS.CONFIRMED });
  const pending = await makeBooking({ patient: hari, caregiver: ram, serviceName: 'Post-Surgery Care', locType: LOCATION_TYPE.HOME, address: 'Baneshwor, Kathmandu', start: daysFromNow(4, 8), end: daysFromNow(4, 12), status: BOOKING_STATUS.PENDING });
  log('✔ 5 bookings (3 completed, 1 confirmed, 1 pending)');

  // Payments for completed + confirmed
  async function pay(booking, method, status = PAYMENT_STATUS.PAID) {
    return Payment.create({
      booking_id: booking.id,
      amount_paisa: booking.total_amount_paisa,
      method,
      status,
      transaction_ref: `SEED_${booking.id}_${Date.now()}`,
      gateway_ref: `GW_${booking.id}`,
      paid_at: status === PAYMENT_STATUS.PAID ? new Date(booking.start_datetime) : null,
    });
  }
  await pay(completed1, PAYMENT_METHODS.ESEWA);
  await pay(completed2, PAYMENT_METHODS.KHALTI);
  await pay(completed3, PAYMENT_METHODS.BANK);
  await pay(confirmed, PAYMENT_METHODS.ESEWA);
  log('✔ 4 payments');

  // Reviews on completed bookings (drives caregiver ratings)
  await Review.create({ booking_id: completed1.id, patient_id: hari.id, caregiver_id: sita.id, rating: 5, punctuality: 5, care_quality: 5, communication: 4, comment: 'Sita was wonderful with my father. Punctual, kind, and very professional.' });
  await Review.create({ booking_id: completed2.id, patient_id: gita.id, caregiver_id: ram.id, rating: 4, punctuality: 4, care_quality: 5, communication: 4, comment: 'Reliable hospital sitter. Kept us informed throughout the night.' });
  await Review.create({ booking_id: completed3.id, patient_id: hari.id, caregiver_id: anita.id, rating: 5, punctuality: 5, care_quality: 5, communication: 5, comment: 'Excellent newborn care. Highly recommend Anita to any new parent.' });

  await recomputeCaregiverRatings(sita.id);
  await recomputeCaregiverRatings(ram.id);
  await recomputeCaregiverRatings(anita.id);
  log('✔ 3 reviews + recomputed ratings');

  if (!silent) {
    console.log('\n─────────────────────────────────────────────');
    console.log('  SmartCare demo data seeded successfully!');
    console.log('─────────────────────────────────────────────');
    console.log('  Login with any of these (password for all: ' + DEMO_PASSWORD + ')');
    console.log('  • Admin:     admin@smartcare.local');
    console.log('  • Caregiver: sita@smartcare.local  (verified)');
    console.log('  • Caregiver: deepak@smartcare.local (pending verification)');
    console.log('  • Patient:   hari@smartcare.local');
    console.log('─────────────────────────────────────────────\n');
  }
}

// ── CLI entry (node src/utils/seed.js [--reset]) ─────────────
const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href;
if (isMain) {
  const reset = process.argv.includes('--reset');
  (async () => {
    try {
      await ensureDatabaseExists();
      await testConnection();
      if (reset) {
        console.log('⚠  --reset: dropping and recreating all tables...');
        await sequelize.sync({ force: true });
      } else {
        await sequelize.sync(); // create missing tables, keep existing
        const count = await User.count();
        if (count > 0) {
          console.log('Database already has data. Use "npm run db:reset" to wipe and re-seed.');
          await sequelize.close();
          process.exit(0);
        }
      }
      await runSeed({ silent: false });
      await sequelize.close();
      process.exit(0);
    } catch (err) {
      logger.error('Seed failed: %s', err.stack || err.message);
      process.exit(1);
    }
  })();
}
