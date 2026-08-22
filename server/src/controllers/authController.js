import { Op } from 'sequelize';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { recordAudit } from '../services/auditService.js';
import env from '../config/env.js';
import { ROLES, USER_STATUS } from '../config/constants.js';
import db, { User, CaregiverProfile, PatientProfile, RefreshToken } from '../models/index.js';

const REFRESH_COOKIE = 'smartcare_refresh';
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  };
}

async function issueTokens(user, res) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });
  await RefreshToken.create({
    user_id: user.id,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return accessToken;
}

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, consent } = req.body;

  // Admin accounts are provisioned, never self-registered (§6.1).
  const chosenRole = role === ROLES.CAREGIVER ? ROLES.CAREGIVER : ROLES.PATIENT;

  if (!consent) throw ApiError.badRequest('You must accept the privacy consent to register');

  const existing = await User.findOne({ where: { email: String(email).toLowerCase() } });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const result = await db.sequelize.transaction(async (t) => {
    const user = await User.create(
      {
        name,
        email,
        phone,
        password, // hashed by model hook
        role: chosenRole,
        status: USER_STATUS.ACTIVE,
        consent_accepted_at: new Date(),
      },
      { transaction: t }
    );

    if (chosenRole === ROLES.CAREGIVER) {
      await CaregiverProfile.create({ user_id: user.id }, { transaction: t });
    } else {
      await PatientProfile.create({ user_id: user.id }, { transaction: t });
    }
    return user;
  });

  await recordAudit({ userId: result.id, action: 'register', resource: `user:${result.id}`, ip: req.ip });

  const accessToken = await issueTokens(result, res);
  res.status(201).json({ user: result.toSafeJSON(), accessToken });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email: String(email).toLowerCase() } });

  // Generic message avoids leaking which accounts exist.
  const invalid = () => ApiError.unauthorized('Invalid email or password');

  if (!user) {
    await recordAudit({ action: 'login_failed', resource: `email:${email}`, ip: req.ip });
    throw invalid();
  }

  // Account lockout with backoff (§9.1).
  if (user.lock_until && user.lock_until > new Date()) {
    const mins = Math.ceil((user.lock_until - new Date()) / 60000);
    throw ApiError.tooMany(`Too many failed attempts. Try again in ${mins} minute(s).`);
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    user.failed_login_attempts += 1;
    if (user.failed_login_attempts >= MAX_ATTEMPTS) {
      user.lock_until = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.failed_login_attempts = 0;
    }
    await user.save();
    await recordAudit({ userId: user.id, action: 'login_failed', ip: req.ip });
    throw invalid();
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw ApiError.forbidden('Your account has been suspended. Please contact support.');
  }

  user.failed_login_attempts = 0;
  user.lock_until = null;
  await user.save();

  await recordAudit({ userId: user.id, action: 'login', ip: req.ip });

  const accessToken = await issueTokens(user, res);
  res.json({ user: user.toSafeJSON(), accessToken });
});

// POST /api/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized('No refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const stored = await RefreshToken.findOne({
    where: { token, user_id: payload.sub, revoked_at: { [Op.is]: null }, expires_at: { [Op.gt]: new Date() } },
  });
  if (!stored) throw ApiError.unauthorized('Session no longer valid');

  const user = await User.findByPk(payload.sub);
  if (!user || user.status === USER_STATUS.SUSPENDED) throw ApiError.unauthorized('Account unavailable');

  // Rotate the refresh token.
  stored.revoked_at = new Date();
  await stored.save();
  const accessToken = await issueTokens(user, res);
  res.json({ user: user.toSafeJSON(), accessToken });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await RefreshToken.update({ revoked_at: new Date() }, { where: { token } });
  }
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ message: 'Logged out' });
});
