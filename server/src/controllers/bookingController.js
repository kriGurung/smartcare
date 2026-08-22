import { Op } from 'sequelize';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { recordAudit } from '../services/auditService.js';
import { notify } from '../services/notificationService.js';
import { getCommissionPercent, getCheckinRadiusMeters } from './adminController.js';
import { distanceMeters } from '../utils/geo.js';
import {
  ROLES,
  VERIFICATION_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  LOCATION_TYPE,
  NOTIFICATION_TYPES,
} from '../config/constants.js';
import db, {
  User,
  Booking,
  CaregiverProfile,
  Service,
  Payment,
  Review,
  CareLog,
} from '../models/index.js';

const bookingInclude = [
  { model: User, as: 'patient', attributes: ['id', 'name', 'phone'] },
  { model: User, as: 'caregiver', attributes: ['id', 'name', 'phone'] },
  { model: Service, as: 'service', attributes: ['id', 'name'] },
  { model: Payment, as: 'payments' },
  { model: Review, as: 'review' },
];

// POST /api/bookings  (patient only)
export const createBooking = asyncHandler(async (req, res) => {
  const {
    caregiver_id, service_id, location_type, address, hospital_name,
    start_datetime, end_datetime, patient_note,
    latitude, longitude,
  } = req.body;

  if (!Object.values(LOCATION_TYPE).includes(location_type)) {
    throw ApiError.badRequest('location_type must be "home" or "hospital"');
  }

  const start = new Date(start_datetime);
  const end = new Date(end_datetime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw ApiError.badRequest('Invalid start or end date/time');
  }
  if (end <= start) throw ApiError.badRequest('End time must be after start time');
  if (start < new Date()) throw ApiError.badRequest('Start time cannot be in the past');

  const caregiver = await User.findByPk(caregiver_id, {
    include: [{ model: CaregiverProfile, as: 'caregiverProfile' }],
  });
  if (!caregiver || caregiver.role !== ROLES.CAREGIVER) throw ApiError.notFound('Caregiver not found');
  const profile = caregiver.caregiverProfile;
  if (!profile || profile.verification_status !== VERIFICATION_STATUS.VERIFIED) {
    throw ApiError.badRequest('This caregiver is not available for booking');
  }
  if (location_type === LOCATION_TYPE.HOME && !profile.serves_home) {
    throw ApiError.badRequest('This caregiver does not offer home visits');
  }
  if (location_type === LOCATION_TYPE.HOSPITAL && !profile.serves_hospital) {
    throw ApiError.badRequest('This caregiver does not offer hospital care');
  }

  if (service_id) {
    const svc = await Service.findByPk(service_id);
    if (!svc) throw ApiError.badRequest('Selected service does not exist');
  }

  // Pricing — integer paisa throughout (§7).
  const hours = Math.round(((end - start) / (1000 * 60 * 60)) * 100) / 100;
  const rate = profile.hourly_rate_paisa || 0;
  const total = Math.round(hours * rate);
  const commissionPct = await getCommissionPercent();
  const commission = Math.round((total * commissionPct) / 100);
  const earning = total - commission;

  const booking = await Booking.create({
    patient_id: req.user.id,
    caregiver_id,
    service_id: service_id || null,
    location_type,
    address,
    hospital_name: location_type === LOCATION_TYPE.HOSPITAL ? hospital_name || null : null,
    start_datetime: start,
    end_datetime: end,
    hours,
    hourly_rate_paisa: rate,
    total_amount_paisa: total,
    commission_paisa: commission,
    caregiver_earning_paisa: earning,
    status: BOOKING_STATUS.PENDING,
    patient_note: patient_note || null,
    latitude: latitude || null,
    longitude: longitude || null,
  });

  await recordAudit({ userId: req.user.id, action: 'booking_create', resource: `booking:${booking.id}`, ip: req.ip });
  await notify({
    userId: caregiver.id,
    type: NOTIFICATION_TYPES.BOOKING,
    title: 'New booking request',
    message: `${req.user.name} requested care on ${start.toLocaleString()}.`,
    link: '/caregiver/requests',
    phone: caregiver.phone,
  });

  const full = await Booking.findByPk(booking.id, { include: bookingInclude });
  res.status(201).json({ booking: full });
});

// GET /api/bookings  — scoped by role
export const listBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = {};
  if (req.user.role === ROLES.PATIENT) where.patient_id = req.user.id;
  else if (req.user.role === ROLES.CAREGIVER) where.caregiver_id = req.user.id;
  // admin: no scope filter — sees all

  if (status) where.status = status;

  const bookings = await Booking.findAll({
    where,
    include: bookingInclude,
    order: [['start_datetime', 'DESC']],
    limit: 200,
  });
  res.json({ bookings });
});

// GET /api/bookings/:id — ownership enforced
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.id, {
    include: [...bookingInclude, { model: CareLog, as: 'careLogs' }],
  });
  if (!booking) throw ApiError.notFound('Booking not found');
  assertBookingAccess(req.user, booking);
  res.json({ booking });
});

// Valid transitions keyed by requesting role.
const TRANSITIONS = {
  accept: { from: [BOOKING_STATUS.PENDING], to: BOOKING_STATUS.CONFIRMED, role: ROLES.CAREGIVER },
  decline: { from: [BOOKING_STATUS.PENDING], to: BOOKING_STATUS.DECLINED, role: ROLES.CAREGIVER },
  start: { from: [BOOKING_STATUS.CONFIRMED], to: BOOKING_STATUS.IN_PROGRESS, role: ROLES.CAREGIVER },
  complete: { from: [BOOKING_STATUS.IN_PROGRESS], to: BOOKING_STATUS.COMPLETED, role: ROLES.CAREGIVER },
  cancel:   { from: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED], to: BOOKING_STATUS.CANCELLED, role: ROLES.PATIENT },
  reschedule: { from: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED], to: null, role: ROLES.PATIENT },
};

// PUT /api/bookings/:id/status  { action, reason? }
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { action, reason } = req.body;
  const booking = await Booking.findByPk(req.params.id, { include: bookingInclude });
  if (!booking) throw ApiError.notFound('Booking not found');
  assertBookingAccess(req.user, booking);

  const rule = TRANSITIONS[action];
  if (!rule) throw ApiError.badRequest(`Unknown action "${action}"`);

  const isAdmin = req.user.role === ROLES.ADMIN;
  if (!isAdmin && req.user.role !== rule.role) {
    throw ApiError.forbidden(`Only a ${rule.role} can ${action} this booking`);
  }
  if (!isAdmin && !rule.from.includes(booking.status)) {
    throw ApiError.badRequest(`Cannot ${action} a booking that is "${booking.status}"`);
  }

  if (action === 'reschedule') {
    const { start_datetime, end_datetime } = req.body;
    const start = new Date(start_datetime);
    const end = new Date(end_datetime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw ApiError.badRequest('Invalid start or end date/time');
    }
    if (end <= start) throw ApiError.badRequest('End time must be after start time');
    if (start < new Date()) throw ApiError.badRequest('Start time cannot be in the past');

    const hours = Math.round(((end - start) / (1000 * 60 * 60)) * 100) / 100;
    const rate = booking.hourly_rate_paisa || 0;
    const total = Math.round(hours * rate);
    const commissionPct = await getCommissionPercent();
    const commission = Math.round((total * commissionPct) / 100);
    const earning = total - commission;

    booking.start_datetime = start;
    booking.end_datetime = end;
    booking.hours = hours;
    booking.total_amount_paisa = total;
    booking.commission_paisa = commission;
    booking.caregiver_earning_paisa = earning;
    await booking.save();

    await recordAudit({
      userId: req.user.id,
      action: 'booking_reschedule',
      resource: `booking:${booking.id}`,
      meta: { newStart: start, newEnd: end },
      ip: req.ip,
    });

    const recipientId = booking.caregiver_id;
    await notify({
      userId: recipientId,
      type: NOTIFICATION_TYPES.BOOKING,
      title: 'Booking rescheduled',
      message: `${req.user.name} rescheduled the visit to ${start.toLocaleString()}.`,
      link: `/caregiver/requests`,
    });

    const full = await Booking.findByPk(booking.id, { include: bookingInclude });
    return res.json({ booking: full });
  }

  // ── Geofenced check-in for "start" action ──────────────────────────────
  let checkInMeta = {};
  if (action === 'start' && !isAdmin) {
    const { latitude: lat, longitude: lng, reason } = req.body;
    if (lat == null || lng == null) {
      throw ApiError.badRequest('Location is required to start a visit', { code: 'LOCATION_REQUIRED' });
    }

    // If the patient pinned a location, compare against it
    if (booking.latitude != null && booking.longitude != null) {
      const radius = await getCheckinRadiusMeters();
      const dist = distanceMeters(
        Number(booking.latitude), Number(booking.longitude),
        Number(lat), Number(lng)
      );
      const outside = dist > radius;

      if (outside && !reason) {
        throw ApiError.conflict('You appear to be outside the visit location.', {
          code: 'OUTSIDE_PERIMETER',
          distanceMeters: dist,
          radiusMeters: radius,
        });
      }

      checkInMeta = {
        check_in_distance_m: dist,
        check_in_outside_perimeter: outside,
        check_in_override_reason: outside ? reason : null,
      };
    }

    checkInMeta.check_in_at = new Date();
    checkInMeta.check_in_lat = lat;
    checkInMeta.check_in_lng = lng;
  }

  booking.status = rule.to;
  if (action === 'decline') booking.decline_reason = reason || null;
  if (action === 'cancel') booking.cancelled_by = req.user.id;

  // Apply check-in fields
  Object.assign(booking, checkInMeta);

  // Best-effort check-out logging for "complete"
  if (action === 'complete') {
    const { latitude: lat, longitude: lng } = req.body;
    if (lat != null && lng != null) {
      booking.check_out_at = new Date();
      booking.check_out_lat = lat;
      booking.check_out_lng = lng;
    }
  }

  await booking.save();

  // Auto-refund paid payments on cancellation.
  if (action === 'cancel') {
    const paidPayments = await Payment.findAll({
      where: { booking_id: booking.id, status: PAYMENT_STATUS.PAID },
    });
    for (const p of paidPayments) {
      p.status = PAYMENT_STATUS.REFUNDED;
      p.refunded_at = new Date();
      await p.save();
      await recordAudit({
        userId: req.user.id,
        action: 'payment_auto_refund',
        resource: `payment:${p.id}`,
        meta: { reason: 'booking_cancelled' },
        ip: req.ip,
      });
    }
  }

  await recordAudit({
    userId: req.user.id,
    action: `booking_${action}`,
    resource: `booking:${booking.id}`,
    meta: { newStatus: rule.to, ...checkInMeta },
    ip: req.ip,
  });

  // Notify the other party.
  await notifyStatusChange(booking, action, req.user);

  const full = await Booking.findByPk(booking.id, { include: bookingInclude });
  res.json({ booking: full });
});

// Admin override — set any status directly (§3.2 "Override/Cancel any").
export const adminOverrideStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  if (!Object.values(BOOKING_STATUS).includes(status)) {
    throw ApiError.badRequest('Invalid status');
  }
  const booking = await Booking.findByPk(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  booking.status = status;
  if (status === BOOKING_STATUS.CANCELLED) booking.cancelled_by = req.user.id;
  if (reason) booking.decline_reason = reason;
  await booking.save();
  await recordAudit({ userId: req.user.id, action: 'booking_admin_override', resource: `booking:${booking.id}`, meta: { status }, ip: req.ip });
  const full = await Booking.findByPk(booking.id, { include: bookingInclude });
  res.json({ booking: full });
});

// ── Care logs (§11 digital care log / handover notes) ──

// POST /api/bookings/:id/care-logs  (caregiver, own booking)
export const addCareLog = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (req.user.role !== ROLES.CAREGIVER || booking.caregiver_id !== req.user.id) {
    throw ApiError.forbidden('Only the assigned caregiver can add care logs');
  }
  if (![BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETED].includes(booking.status)) {
    throw ApiError.badRequest('Care logs can only be added once a visit is in progress');
  }
  const { tasks_completed, observations, patient_mood } = req.body;
  const log = await CareLog.create({
    booking_id: booking.id,
    caregiver_id: req.user.id,
    tasks_completed,
    observations,
    patient_mood,
  });

  await notify({
    userId: booking.patient_id,
    type: NOTIFICATION_TYPES.BOOKING,
    title: 'New care log added',
    message: 'Your caregiver added a visit note.',
    link: `/patient/bookings/${booking.id}`,
  });

  res.status(201).json({ careLog: log });
});

// GET /api/bookings/:id/care-logs
export const listCareLogs = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  assertBookingAccess(req.user, booking);
  const logs = await CareLog.findAll({ where: { booking_id: booking.id }, order: [['logged_at', 'DESC']] });
  res.json({ careLogs: logs });
});

// ── Helpers ──────────────────────────────────────────────
function assertBookingAccess(user, booking) {
  if (user.role === ROLES.ADMIN) return;
  const owns = booking.patient_id === user.id || booking.caregiver_id === user.id;
  if (!owns) throw ApiError.notFound('Booking not found'); // 404, not 403 — don't confirm existence (anti-IDOR, §3.2)
}

async function notifyStatusChange(booking, action, actor) {
  const recipientId = actor.id === booking.patient_id ? booking.caregiver_id : booking.patient_id;
  const messages = {
    accept: 'Your booking was accepted.',
    decline: 'Your booking request was declined.',
    start: 'Your caregiver has started the visit.',
    complete: 'Your visit is complete. You can now leave a review.',
    cancel: 'A booking was cancelled.',
  };
  await notify({
    userId: recipientId,
    type: NOTIFICATION_TYPES.BOOKING,
    title: 'Booking update',
    message: messages[action] || 'Your booking status changed.',
    link: '/',
  });
}

export { assertBookingAccess };
