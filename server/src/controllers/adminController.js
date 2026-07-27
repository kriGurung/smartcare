import { Op, fn, col, literal } from 'sequelize';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { recordAudit } from '../services/auditService.js';
import { notify } from '../services/notificationService.js';
import { formatNpr } from '../utils/money.js';
import {
  ROLES,
  USER_STATUS,
  VERIFICATION_STATUS,
  DOC_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES,
  DEFAULT_COMMISSION_PERCENT,
} from '../config/constants.js';
import {
  User,
  CaregiverProfile,
  CaregiverDocument,
  Booking,
  Payment,
  Review,
  Setting,
} from '../models/index.js';

// Shared helper — current commission %, read by bookingController too.
export async function getCommissionPercent() {
  const s = await Setting.findByPk('commission_percent');
  const v = s?.value;
  return typeof v === 'number' ? v : DEFAULT_COMMISSION_PERCENT;
}

// GET /api/admin/caregivers/pending
export const getPendingCaregivers = asyncHandler(async (req, res) => {
  const caregivers = await User.findAll({
    where: { role: ROLES.CAREGIVER },
    include: [
      {
        model: CaregiverProfile,
        as: 'caregiverProfile',
        where: { verification_status: VERIFICATION_STATUS.PENDING },
        required: true,
      },
      { model: CaregiverDocument, as: 'documents' },
    ],
    order: [['created_at', 'ASC']],
  });
  res.json({ caregivers: caregivers.map(shapePendingCaregiver) });
});

// GET /api/admin/caregivers/:id/documents
export const getCaregiverDocuments = asyncHandler(async (req, res) => {
  const docs = await CaregiverDocument.findAll({
    where: { caregiver_id: req.params.id },
    order: [['created_at', 'DESC']],
  });
  res.json({
    documents: docs.map((d) => ({
      id: d.id,
      docType: d.doc_type,
      originalName: d.original_name,
      status: d.status,
      reviewNote: d.review_note,
      downloadUrl: `/api/files/documents/${d.file_path}`,
      createdAt: d.created_at,
    })),
  });
});

// PUT /api/admin/documents/:id/review  { status, note }
export const reviewDocument = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (![DOC_STATUS.APPROVED, DOC_STATUS.REJECTED].includes(status)) {
    throw ApiError.badRequest('status must be "approved" or "rejected"');
  }
  const doc = await CaregiverDocument.findByPk(req.params.id);
  if (!doc) throw ApiError.notFound('Document not found');
  doc.status = status;
  doc.review_note = note || null;
  await doc.save();
  await recordAudit({ userId: req.user.id, action: 'document_review', resource: `document:${doc.id}`, meta: { status }, ip: req.ip });
  res.json({ document: { id: doc.id, status: doc.status, reviewNote: doc.review_note } });
});

// PUT /api/admin/caregivers/:id/verify
export const verifyCaregiver = asyncHandler(async (req, res) => {
  const profile = await CaregiverProfile.findOne({ where: { user_id: req.params.id } });
  if (!profile) throw ApiError.notFound('Caregiver profile not found');

  profile.verification_status = VERIFICATION_STATUS.VERIFIED;
  profile.verified_by = req.user.id;
  profile.verified_at = new Date();
  profile.rejection_reason = null;
  await profile.save();

  // Mark any pending docs approved on full verification.
  await CaregiverDocument.update(
    { status: DOC_STATUS.APPROVED },
    { where: { caregiver_id: req.params.id, status: DOC_STATUS.PENDING } }
  );

  await recordAudit({ userId: req.user.id, action: 'caregiver_verify', resource: `user:${req.params.id}`, ip: req.ip });
  await notify({
    userId: Number(req.params.id),
    type: NOTIFICATION_TYPES.VERIFICATION,
    title: 'You are verified!',
    message: 'Your account has been verified. You now appear in patient search results.',
    link: '/caregiver',
  });

  res.json({ message: 'Caregiver verified', verification_status: profile.verification_status });
});

// PUT /api/admin/caregivers/:id/reject  { reason }
export const rejectCaregiver = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) throw ApiError.badRequest('A rejection reason is required');
  const profile = await CaregiverProfile.findOne({ where: { user_id: req.params.id } });
  if (!profile) throw ApiError.notFound('Caregiver profile not found');

  profile.verification_status = VERIFICATION_STATUS.REJECTED;
  profile.rejection_reason = reason.trim();
  profile.verified_by = req.user.id;
  await profile.save();

  await recordAudit({ userId: req.user.id, action: 'caregiver_reject', resource: `user:${req.params.id}`, meta: { reason }, ip: req.ip });
  await notify({
    userId: Number(req.params.id),
    type: NOTIFICATION_TYPES.VERIFICATION,
    title: 'Verification needs attention',
    message: `Your verification was not approved: ${reason.trim()}. Please re-submit your documents.`,
    link: '/caregiver/profile',
  });

  res.json({ message: 'Caregiver rejected', verification_status: profile.verification_status });
});

// GET /api/admin/users  ?role=&status=&q=
export const listUsers = asyncHandler(async (req, res) => {
  const { role, status, q } = req.query;
  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (q) where[Op.or] = [{ name: { [Op.like]: `%${q}%` } }, { email: { [Op.like]: `%${q}%` } }];

  const users = await User.findAll({
    where,
    attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'created_at'],
    include: [{ model: CaregiverProfile, as: 'caregiverProfile', attributes: ['verification_status', 'avg_rating'] }],
    order: [['created_at', 'DESC']],
    limit: 300,
  });
  res.json({ users });
});

// PUT /api/admin/users/:id/status  { status }
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (![USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED].includes(status)) {
    throw ApiError.badRequest('status must be "active" or "suspended"');
  }
  const user = await User.findByPk(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === ROLES.ADMIN) throw ApiError.forbidden('Admin accounts cannot be suspended here');

  user.status = status;
  await user.save();
  await recordAudit({ userId: req.user.id, action: 'user_status_change', resource: `user:${user.id}`, meta: { status }, ip: req.ip });
  res.json({ user: user.toSafeJSON() });
});

// GET /api/admin/reports/summary
export const getSummary = asyncHandler(async (req, res) => {
  const [patients, caregivers, verified, pendingVerify, totalBookings, completedBookings, activeBookings] =
    await Promise.all([
      User.count({ where: { role: ROLES.PATIENT } }),
      User.count({ where: { role: ROLES.CAREGIVER } }),
      CaregiverProfile.count({ where: { verification_status: VERIFICATION_STATUS.VERIFIED } }),
      CaregiverProfile.count({ where: { verification_status: VERIFICATION_STATUS.PENDING } }),
      Booking.count(),
      Booking.count({ where: { status: BOOKING_STATUS.COMPLETED } }),
      Booking.count({ where: { status: { [Op.in]: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS] } } }),
    ]);

  const revenueAgg = await Payment.findOne({
    where: { status: PAYMENT_STATUS.PAID },
    attributes: [
      [fn('COALESCE', fn('SUM', col('amount_paisa')), 0), 'gross'],
    ],
    raw: true,
  });
  const grossPaisa = Number(revenueAgg?.gross || 0);

  // Platform revenue = commission on completed bookings that are paid.
  const commissionAgg = await Booking.findOne({
    where: { status: BOOKING_STATUS.COMPLETED },
    attributes: [[fn('COALESCE', fn('SUM', col('commission_paisa')), 0), 'commission']],
    raw: true,
  });

  res.json({
    summary: {
      patients,
      caregivers,
      verifiedCaregivers: verified,
      pendingVerification: pendingVerify,
      totalBookings,
      completedBookings,
      activeBookings,
      grossVolumePaisa: grossPaisa,
      platformRevenuePaisa: Number(commissionAgg?.commission || 0),
    },
  });
});

// GET /api/admin/reports/revenue  — last 6 months, grouped by month
export const getRevenue = asyncHandler(async (req, res) => {
  const payments = await Payment.findAll({
    where: { status: PAYMENT_STATUS.PAID },
    attributes: ['amount_paisa', 'paid_at'],
    raw: true,
  });

  const buckets = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = { month: key, revenuePaisa: 0, count: 0 };
  }
  for (const p of payments) {
    if (!p.paid_at) continue;
    const d = new Date(p.paid_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (buckets[key]) {
      buckets[key].revenuePaisa += Number(p.amount_paisa);
      buckets[key].count += 1;
    }
  }
  res.json({ revenue: Object.values(buckets) });
});

// GET /api/admin/reports/bookings-trend — bookings per day (last 14 days)
export const getBookingsTrend = asyncHandler(async (req, res) => {
  const bookings = await Booking.findAll({ attributes: ['created_at', 'status'], raw: true });
  const buckets = {};
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { date: key, total: 0, completed: 0 };
  }
  for (const b of bookings) {
    const key = new Date(b.created_at).toISOString().slice(0, 10);
    if (buckets[key]) {
      buckets[key].total += 1;
      if (b.status === BOOKING_STATUS.COMPLETED) buckets[key].completed += 1;
    }
  }
  res.json({ trend: Object.values(buckets) });
});

// GET /api/admin/settings
export const getSettings = asyncHandler(async (req, res) => {
  const all = await Setting.findAll();
  const map = Object.fromEntries(all.map((s) => [s.key, s.value]));
  res.json({
    settings: {
      commission_percent: map.commission_percent ?? DEFAULT_COMMISSION_PERCENT,
      banner: map.banner ?? '',
    },
  });
});

// PUT /api/admin/settings  { commission_percent?, banner? }
export const updateSettings = asyncHandler(async (req, res) => {
  const { commission_percent, banner } = req.body;
  if (commission_percent !== undefined) {
    const pct = Number(commission_percent);
    if (Number.isNaN(pct) || pct < 0 || pct > 50) throw ApiError.badRequest('Commission must be between 0 and 50');
    await Setting.upsert({ key: 'commission_percent', value: pct });
  }
  if (banner !== undefined) {
    await Setting.upsert({ key: 'banner', value: String(banner) });
  }
  await recordAudit({ userId: req.user.id, action: 'settings_update', resource: 'settings', ip: req.ip });
  res.json({ message: 'Settings updated' });
});

// PUT /api/admin/reviews/:id/moderate  { hide }
export const moderateReview = asyncHandler(async (req, res) => {
  const { hide } = req.body;
  const review = await Review.findByPk(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  review.is_hidden = !!hide;
  await review.save();
  await recordAudit({ userId: req.user.id, action: 'review_moderate', resource: `review:${review.id}`, meta: { hidden: !!hide }, ip: req.ip });
  res.json({ review });
});

function shapePendingCaregiver(user) {
  const p = user.caregiverProfile || {};
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.created_at,
    bio: p.bio,
    city: p.city,
    yearsExperience: p.years_experience,
    verificationStatus: p.verification_status,
    documents: (user.documents || []).map((d) => ({
      id: d.id,
      docType: d.doc_type,
      originalName: d.original_name,
      status: d.status,
      downloadUrl: `/api/files/documents/${d.file_path}`,
    })),
  };
}
