import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { recordAudit } from '../services/auditService.js';
import { ROLES, NOTIFICATION_TYPES } from '../config/constants.js';
import { User, UserReport } from '../models/index.js';

// POST /api/reports — create a user report (any authenticated user)
export const createUserReport = asyncHandler(async (req, res) => {
  const { reported_id, reason, description } = req.body;
  if (!reported_id || !reason) {
    throw ApiError.badRequest('reported_id and reason are required');
  }
  if (reported_id === req.user.id) {
    throw ApiError.badRequest('You cannot report yourself');
  }
  const reported = await User.findByPk(reported_id);
  if (!reported) throw ApiError.notFound('Reported user not found');

  const report = await UserReport.create({
    reporter_id: req.user.id,
    reported_id,
    reason,
    description: description || null,
  });

  await recordAudit({
    userId: req.user.id,
    action: 'user_report',
    resource: `user_report:${report.id}`,
    meta: { reported_id, reason },
    ip: req.ip,
  });

  res.status(201).json({ report: { id: report.id, reason: report.reason, status: report.status } });
});

// GET /api/admin/reports/users — list user reports (admin)
export const listUserReports = asyncHandler(async (req, res) => {
  const reports = await UserReport.findAll({
    include: [
      { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'reported', attributes: ['id', 'name', 'email'] },
    ],
    order: [['created_at', 'DESC']],
    limit: 100,
  });
  res.json({ reports });
});

// PUT /api/admin/reports/users/:id — review a user report (admin)
export const reviewUserReport = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['reviewed', 'dismissed'].includes(status)) {
    throw ApiError.badRequest('status must be "reviewed" or "dismissed"');
  }
  const report = await UserReport.findByPk(req.params.id);
  if (!report) throw ApiError.notFound('Report not found');
  report.status = status;
  report.reviewed_by = req.user.id;
  report.reviewed_at = new Date();
  await report.save();

  await recordAudit({
    userId: req.user.id,
    action: 'user_report_review',
    resource: `user_report:${report.id}`,
    meta: { status },
    ip: req.ip,
  });

  res.json({ report: { id: report.id, status: report.status } });
});
