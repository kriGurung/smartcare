import ApiError from '../utils/apiError.js';

// RBAC middleware (§3.2, §9.2). Every protected route declares which roles
// may call it, e.g. requireRole('admin') or requireRole('patient','admin').
export default function requireRole(...roles) {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowed.includes(req.user.role)) {
      return next(ApiError.forbidden('This action requires a different role'));
    }
    next();
  };
}
