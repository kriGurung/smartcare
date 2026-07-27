import { verifyAccessToken } from '../utils/jwt.js';
import ApiError from '../utils/apiError.js';
import { User } from '../models/index.js';
import { USER_STATUS } from '../config/constants.js';

// Verifies the JWT access token from the Authorization header and attaches
// the current user to req.user. This is step 1 of the middleware chain
// (auth -> RBAC -> ownership -> controller) described in §4.
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized('Missing access token');

    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.sub);
    if (!user) throw ApiError.unauthorized('Account no longer exists');
    if (user.status === USER_STATUS.SUSPENDED) {
      throw ApiError.forbidden('Your account has been suspended. Contact support.');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(ApiError.unauthorized('Session expired'));
    if (err.name === 'JsonWebTokenError') return next(ApiError.unauthorized('Invalid token'));
    next(err);
  }
}

// Attaches the user if a valid token is present, but does NOT require one.
// Used on public browsing routes so logged-in extras can be shown when available.
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.sub);
    if (user && user.status !== USER_STATUS.SUSPENDED) req.user = user;
  } catch {
    /* ignore — treat as anonymous */
  }
  next();
}
