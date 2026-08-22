import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { Notification } from '../models/index.js';

// GET /api/notifications
export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.user.id },
    order: [['created_at', 'DESC']],
    limit: 100,
  });
  const unread = notifications.filter((n) => !n.is_read).length;
  res.json({ notifications, unread });
});

// PUT /api/notifications/:id/read
export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification || notification.user_id !== req.user.id) throw ApiError.notFound('Notification not found');
  notification.is_read = true;
  await notification.save();
  res.json({ notification });
});

// PUT /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.update({ is_read: true }, { where: { user_id: req.user.id, is_read: false } });
  res.json({ message: 'All notifications marked as read' });
});
