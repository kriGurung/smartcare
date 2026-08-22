import { fn, col } from 'sequelize';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { notify } from '../services/notificationService.js';
import { recordAudit } from '../services/auditService.js';
import { ROLES, BOOKING_STATUS, NOTIFICATION_TYPES } from '../config/constants.js';
import db, { Booking, Review, CaregiverProfile, User } from '../models/index.js';

// POST /api/reviews  (patient, post-completed booking only)
export const createReview = asyncHandler(async (req, res) => {
  const { booking_id, rating, punctuality, care_quality, communication, comment } = req.body;

  const booking = await Booking.findByPk(booking_id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.patient_id !== req.user.id) throw ApiError.forbidden('You can only review your own bookings');
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw ApiError.badRequest('You can only review a completed booking'); // no drive-by reviews (§2)
  }

  const existing = await Review.findOne({ where: { booking_id } });
  if (existing) throw ApiError.conflict('You have already reviewed this booking');

  const numeric = Number(rating);
  if (!(numeric >= 1 && numeric <= 5)) throw ApiError.badRequest('Rating must be between 1 and 5');

  const review = await db.sequelize.transaction(async (t) => {
    const created = await Review.create(
      {
        booking_id,
        patient_id: req.user.id,
        caregiver_id: booking.caregiver_id,
        rating: numeric,
        punctuality: punctuality || null,
        care_quality: care_quality || null,
        communication: communication || null,
        comment: comment || null,
      },
      { transaction: t }
    );
    await recomputeCaregiverRatings(booking.caregiver_id, t);
    return created;
  });

  await recordAudit({ userId: req.user.id, action: 'review_create', resource: `review:${review.id}`, ip: req.ip });
  await notify({
    userId: booking.caregiver_id,
    type: NOTIFICATION_TYPES.REVIEW,
    title: 'New review',
    message: `You received a ${numeric}-star review.`,
    link: '/caregiver/reviews',
  });

  res.status(201).json({ review });
});

// GET /api/reviews/mine  (caregiver — reviews received)
export const getMyReviews = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.CAREGIVER) throw ApiError.forbidden();
  const reviews = await Review.findAll({
    where: { caregiver_id: req.user.id },
    include: [{ model: User, as: 'patient', attributes: ['id', 'name'] }],
    order: [['created_at', 'DESC']],
  });
  res.json({ reviews });
});

// Recomputes a caregiver's aggregate + sub-ratings from all their reviews.
async function recomputeCaregiverRatings(caregiverId, transaction) {
  const agg = await Review.findOne({
    where: { caregiver_id: caregiverId, is_hidden: false },
    attributes: [
      [fn('AVG', col('rating')), 'avg'],
      [fn('COUNT', col('id')), 'count'],
      [fn('AVG', col('punctuality')), 'p'],
      [fn('AVG', col('care_quality')), 'q'],
      [fn('AVG', col('communication')), 'c'],
    ],
    raw: true,
    transaction,
  });

  await CaregiverProfile.update(
    {
      avg_rating: Number(agg.avg || 0).toFixed(2),
      total_reviews: Number(agg.count || 0),
      avg_punctuality: Number(agg.p || 0).toFixed(2),
      avg_care_quality: Number(agg.q || 0).toFixed(2),
      avg_communication: Number(agg.c || 0).toFixed(2),
    },
    { where: { user_id: caregiverId }, transaction }
  );
}

export { recomputeCaregiverRatings };
