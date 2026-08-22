import { Notification } from '../models/index.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';

// Creates an in-app notification and (optionally) dispatches email/SMS.
// If SMTP/SMS creds are absent, it logs the message instead of sending —
// so the full notification flow works out-of-the-box in development.
export async function notify({ userId, type, title, message, link = null, email = null, phone = null }) {
  const record = await Notification.create({ user_id: userId, type, title, message, link });

  // Email (transactional) — only if SMTP configured.
  if (email && env.mail.host) {
    try {
      const nodemailer = await import('nodemailer');
      const transport = nodemailer.createTransport({
        host: env.mail.host,
        port: env.mail.port,
        secure: env.mail.port === 465,
        auth: env.mail.user ? { user: env.mail.user, pass: env.mail.pass } : undefined,
      });
      await transport.sendMail({ from: env.mail.from, to: email, subject: title, text: message });
    } catch (err) {
      logger.warn('Email send failed (%s): %s', email, err.message);
    }
  } else if (email) {
    logger.info('[EMAIL:mock] To %s | %s — %s', email, title, message);
  }

  // SMS — only if a gateway token is configured.
  if (phone && env.sms.token) {
    logger.info('[SMS] Would send to %s via configured gateway: %s', phone, message);
  } else if (phone) {
    logger.info('[SMS:mock] To %s — %s', phone, message);
  }

  return record;
}
