import { Op, fn, col, literal } from 'sequelize';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { toPaisa } from '../utils/money.js';
import { recordAudit } from '../services/auditService.js';
import {
  ROLES,
  VERIFICATION_STATUS,
  USER_STATUS,
  DOC_TYPES,
  DOC_STATUS,
  BOOKING_STATUS,
} from '../config/constants.js';
import db, {
  User,
  CaregiverProfile,
  CaregiverDocument,
  CaregiverAvailability,
  Service,
  Review,
  Booking,
} from '../models/index.js';

const publicProfileInclude = [
  {
    model: CaregiverProfile,
    as: 'caregiverProfile',
    // Verified caregivers only ever reach patient search (§7 design note).
    where: { verification_status: VERIFICATION_STATUS.VERIFIED },
    required: true,
  },
  { model: Service, as: 'services', through: { attributes: [] } },
];

// GET /api/caregivers  — search/filter verified caregivers
export const searchCaregivers = asyncHandler(async (req, res) => {
  const { q, city, location, service, minRating, sort, available, date, page: pageStr, limit: limitStr } = req.query;

  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(limitStr, 10) || 12));
  const offset = (page - 1) * limit;

  const profileWhere = { verification_status: VERIFICATION_STATUS.VERIFIED };
  if (city) profileWhere.city = { [Op.like]: `%${city}%` };
  if (location === 'home') profileWhere.serves_home = true;
  if (location === 'hospital') profileWhere.serves_hospital = true;
  if (minRating) profileWhere.avg_rating = { [Op.gte]: Number(minRating) };
  if (available === 'true') profileWhere.is_available = true;
  if (available === 'false') profileWhere.is_available = false;

  const userWhere = { role: ROLES.CAREGIVER, status: USER_STATUS.ACTIVE };
  if (q) userWhere.name = { [Op.like]: `%${q}%` };

  // Resolve the service filter to a set of caregiver ids first, so the main
  // query stays a simple hasOne join (no row multiplication, clean ORDER BY).
  if (service) {
    const svc = await Service.findOne({
      where: Number.isNaN(Number(service)) ? { name: { [Op.like]: `%${service}%` } } : { id: Number(service) },
    });
    if (!svc) return res.json({ caregivers: [], total: 0, page, totalPages: 0 });
    const offering = await svc.getCaregivers({ attributes: ['id'], joinTableAttributes: [] });
    const ids = offering.map((u) => u.id);
    if (!ids.length) return res.json({ caregivers: [], total: 0, page, totalPages: 0 });
    userWhere.id = { [Op.in]: ids };
  }

  // Availability-by-date: when a date is provided, only return caregivers
  // who have an availability slot matching the day_of_week of that date.
  let availableOnDateIds = null;
  if (date) {
    const d = new Date(date);
    if (!Number.isNaN(d.getTime())) {
      const dayOfWeek = d.getDay();
      const slots = await CaregiverAvailability.findAll({
        where: { day_of_week: dayOfWeek },
        attributes: ['caregiver_id'],
        group: ['caregiver_id'],
      });
      availableOnDateIds = slots.map((s) => s.caregiver_id);
      if (!availableOnDateIds.length) {
        return res.json({ caregivers: [], total: 0, page, totalPages: 0 });
      }
      userWhere.id = userWhere.id
        ? { [Op.and]: [userWhere.id, { [Op.in]: availableOnDateIds }] }
        : { [Op.in]: availableOnDateIds };
    }
  }

  // Sort against the joined profile (subQuery:false keeps ORDER BY valid).
  const profileRef = { model: CaregiverProfile, as: 'caregiverProfile' };
  let order = [[profileRef, 'avg_rating', 'DESC']];
  if (sort === 'rate_asc') order = [[profileRef, 'hourly_rate_paisa', 'ASC']];
  if (sort === 'rate_desc') order = [[profileRef, 'hourly_rate_paisa', 'DESC']];
  if (sort === 'experience') order = [[profileRef, 'years_experience', 'DESC']];

  const { rows, count: total } = await User.findAndCountAll({
    where: userWhere,
    attributes: ['id', 'name'],
    include: [{ model: CaregiverProfile, as: 'caregiverProfile', where: profileWhere, required: true }],
    order,
    limit,
    offset,
    subQuery: false,
    distinct: true,
  });

  const totalPages = Math.ceil(total / limit);

  // Second pass: attach each caregiver's services (belongsToMany dedupes to
  // one array per user when there's no limit involved).
  const ids = rows.map((r) => r.id);
  const withServices = ids.length
    ? await User.findAll({
        where: { id: { [Op.in]: ids } },
        attributes: ['id'],
        include: [{ model: Service, as: 'services', through: { attributes: [] } }],
      })
    : [];
  const svcMap = new Map(withServices.map((u) => [u.id, u.services || []]));

  const caregivers = rows.map((u) => {
    u.services = svcMap.get(u.id) || [];
    return shapeCaregiverCard(u);
  });

  res.json({ caregivers, total, page, totalPages });
});

// GET /api/caregivers/:id — public profile
export const getCaregiverById = asyncHandler(async (req, res) => {
  const caregiver = await User.findByPk(req.params.id, {
    attributes: ['id', 'name', 'created_at'],
    include: publicProfileInclude,
  });
  if (!caregiver) throw ApiError.notFound('Caregiver not found or not yet verified');

  const availability = await CaregiverAvailability.findAll({
    where: { caregiver_id: caregiver.id },
    order: [['day_of_week', 'ASC'], ['start_time', 'ASC']],
  });

  // Transparent verification checklist (§11) — which document types are approved.
  const docs = await CaregiverDocument.findAll({ where: { caregiver_id: caregiver.id } });
  const checklist = buildVerificationChecklist(docs);

  const reviews = await Review.findAll({
    where: { caregiver_id: caregiver.id, is_hidden: false },
    include: [{ model: User, as: 'patient', attributes: ['id', 'name'] }],
    order: [['created_at', 'DESC']],
    limit: 20,
  });

  res.json({
    caregiver: {
      ...shapeCaregiverCard(caregiver),
      created_at: caregiver.created_at,
      availability,
      verification_checklist: checklist,
      reviews: reviews.map(shapeReview),
    },
  });
});

// GET /api/caregivers/:id/reviews
export const getCaregiverReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.findAll({
    where: { caregiver_id: req.params.id, is_hidden: false },
    include: [{ model: User, as: 'patient', attributes: ['id', 'name'] }],
    order: [['created_at', 'DESC']],
  });
  res.json({ reviews: reviews.map(shapeReview) });
});

// GET /api/caregivers/:id/availability
export const getAvailability = asyncHandler(async (req, res) => {
  const availability = await CaregiverAvailability.findAll({
    where: { caregiver_id: req.params.id },
    order: [['day_of_week', 'ASC'], ['start_time', 'ASC']],
  });
  res.json({ availability });
});

// ── Caregiver self-management (ownership enforced: :id must be req.user) ──

function assertSelf(req) {
  if (String(req.user.id) !== String(req.params.id)) {
    throw ApiError.forbidden('You can only manage your own caregiver profile');
  }
}

// PUT /api/caregivers/:id — update own profile
export const updateCaregiverProfile = asyncHandler(async (req, res) => {
  assertSelf(req);
  const [profile] = await CaregiverProfile.findOrCreate({ where: { user_id: req.user.id } });

  const {
    bio, years_experience, hourly_rate_npr, city, gender, languages,
    serves_home, serves_hospital, is_available, serviceIds,
  } = req.body;

  if (bio !== undefined) profile.bio = bio;
  if (years_experience !== undefined) profile.years_experience = years_experience;
  if (hourly_rate_npr !== undefined) profile.hourly_rate_paisa = toPaisa(hourly_rate_npr);
  if (city !== undefined) profile.city = city;
  if (gender !== undefined) profile.gender = gender;
  if (languages !== undefined) profile.languages = languages;
  if (serves_home !== undefined) profile.serves_home = !!serves_home;
  if (serves_hospital !== undefined) profile.serves_hospital = !!serves_hospital;
  if (is_available !== undefined) profile.is_available = !!is_available;
  await profile.save();

  // Update offered services (many-to-many).
  if (Array.isArray(serviceIds)) {
    const user = await User.findByPk(req.user.id);
    await user.setServices(serviceIds);
  }

  const updated = await User.findByPk(req.user.id, {
    attributes: ['id', 'name'],
    include: [
      { model: CaregiverProfile, as: 'caregiverProfile' },
      { model: Service, as: 'services', through: { attributes: [] } },
    ],
  });
  res.json({ caregiver: shapeCaregiverCard(updated) });
});

// POST /api/caregivers/:id/documents — upload a verification document
export const uploadDocument = asyncHandler(async (req, res) => {
  assertSelf(req);
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const { doc_type } = req.body;
  if (!Object.values(DOC_TYPES).includes(doc_type)) {
    throw ApiError.badRequest(`doc_type must be one of: ${Object.values(DOC_TYPES).join(', ')}`);
  }

  const doc = await CaregiverDocument.create({
    caregiver_id: req.user.id,
    doc_type,
    file_path: req.file.filename,
    original_name: req.file.originalname,
    mime_type: req.file.mimetype,
    status: DOC_STATUS.PENDING,
  });

  // Re-submitting documents moves the profile back to pending review.
  const profile = await CaregiverProfile.findOne({ where: { user_id: req.user.id } });
  if (profile && profile.verification_status !== VERIFICATION_STATUS.VERIFIED) {
    profile.verification_status = VERIFICATION_STATUS.PENDING;
    await profile.save();
  }

  await recordAudit({ userId: req.user.id, action: 'document_upload', resource: `document:${doc.id}`, ip: req.ip });
  res.status(201).json({ document: shapeDocument(doc) });
});

// GET /api/caregivers/:id/documents — own documents
export const getMyDocuments = asyncHandler(async (req, res) => {
  assertSelf(req);
  const docs = await CaregiverDocument.findAll({
    where: { caregiver_id: req.user.id },
    order: [['created_at', 'DESC']],
  });
  res.json({ documents: docs.map(shapeDocument) });
});

// PUT /api/caregivers/:id/availability — set weekly availability
export const setAvailability = asyncHandler(async (req, res) => {
  assertSelf(req);
  const { slots } = req.body; // [{ day_of_week, start_time, end_time }]
  if (!Array.isArray(slots)) throw ApiError.badRequest('slots must be an array');

  await db.sequelize.transaction(async (t) => {
    await CaregiverAvailability.destroy({ where: { caregiver_id: req.user.id }, transaction: t });
    if (slots.length) {
      await CaregiverAvailability.bulkCreate(
        slots.map((s) => ({
          caregiver_id: req.user.id,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          is_recurring: true,
        })),
        { transaction: t }
      );
    }
  });

  const availability = await CaregiverAvailability.findAll({
    where: { caregiver_id: req.user.id },
    order: [['day_of_week', 'ASC'], ['start_time', 'ASC']],
  });
  res.json({ availability });
});

// PUT /api/caregivers/:id/photo — upload profile photo
export const uploadProfilePhoto = asyncHandler(async (req, res) => {
  assertSelf(req);
  if (!req.file) throw ApiError.badRequest('No image uploaded');
  const profile = await CaregiverProfile.findOne({ where: { user_id: req.user.id } });
  profile.profile_photo_url = `/api/files/photos/${req.file.filename}`;
  await profile.save();
  res.json({ profile_photo_url: profile.profile_photo_url });
});

// GET /api/caregivers/me/stats — caregiver dashboard KPIs & earnings
export const getMyStats = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.CAREGIVER) throw ApiError.forbidden();
  const caregiverId = req.user.id;

  const [pending, upcoming, completed] = await Promise.all([
    Booking.count({ where: { caregiver_id: caregiverId, status: BOOKING_STATUS.PENDING } }),
    Booking.count({ where: { caregiver_id: caregiverId, status: { [Op.in]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS] } } }),
    Booking.count({ where: { caregiver_id: caregiverId, status: BOOKING_STATUS.COMPLETED } }),
  ]);

  const earnings = await Booking.findOne({
    where: { caregiver_id: caregiverId, status: BOOKING_STATUS.COMPLETED },
    attributes: [[fn('COALESCE', fn('SUM', col('caregiver_earning_paisa')), 0), 'total']],
    raw: true,
  });

  const profile = await CaregiverProfile.findOne({ where: { user_id: caregiverId } });

  res.json({
    stats: {
      pendingRequests: pending,
      upcomingJobs: upcoming,
      completedJobs: completed,
      totalEarningsPaisa: Number(earnings?.total || 0),
      avgRating: Number(profile?.avg_rating || 0),
      totalReviews: profile?.total_reviews || 0,
      verificationStatus: profile?.verification_status,
    },
  });
});

// ── Shapers ──────────────────────────────────────────────
function shapeCaregiverCard(user) {
  const p = user.caregiverProfile || {};
  return {
    id: user.id,
    name: user.name,
    bio: p.bio || null,
    city: p.city || null,
    gender: p.gender || null,
    languages: p.languages || null,
    yearsExperience: p.years_experience || 0,
    hourlyRatePaisa: p.hourly_rate_paisa || 0,
    avgRating: Number(p.avg_rating || 0),
    totalReviews: p.total_reviews || 0,
    subRatings: {
      punctuality: Number(p.avg_punctuality || 0),
      careQuality: Number(p.avg_care_quality || 0),
      communication: Number(p.avg_communication || 0),
    },
    servesHome: p.serves_home ?? true,
    servesHospital: p.serves_hospital ?? true,
    isAvailable: p.is_available ?? true,
    verificationStatus: p.verification_status,
    profilePhotoUrl: p.profile_photo_url || null,
    services: (user.services || []).map((s) => ({ id: s.id, name: s.name })),
  };
}

function shapeDocument(doc) {
  return {
    id: doc.id,
    docType: doc.doc_type,
    originalName: doc.original_name,
    status: doc.status,
    reviewNote: doc.review_note,
    downloadUrl: `/api/files/documents/${doc.file_path}`,
    createdAt: doc.created_at,
  };
}

function shapeReview(r) {
  return {
    id: r.id,
    rating: r.rating,
    punctuality: r.punctuality,
    careQuality: r.care_quality,
    communication: r.communication,
    comment: r.comment,
    patientName: r.patient?.name || 'Patient',
    createdAt: r.created_at,
  };
}

function buildVerificationChecklist(docs) {
  const byType = {};
  for (const d of docs) {
    // keep the "best" status per type (approved beats pending beats rejected/none)
    const rank = { approved: 3, pending: 2, rejected: 1 };
    if (!byType[d.doc_type] || rank[d.status] > rank[byType[d.doc_type]]) {
      byType[d.doc_type] = d.status;
    }
  }
  return Object.values(DOC_TYPES).map((type) => ({
    docType: type,
    label: {
      citizenship: 'Citizenship / National ID',
      certificate: 'Training Certificate',
      police_report: 'Police Clearance',
    }[type],
    status: byType[type] || 'missing',
  }));
}

export { shapeCaregiverCard };
