import { validationResult } from 'express-validator';
import ApiError from '../utils/apiError.js';

// Runs after an express-validator chain; converts any errors into a 400.
export default function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(ApiError.badRequest('Please correct the highlighted fields', details));
  }
  next();
}
