import logger from '../utils/logger.js';
import env from '../config/env.js';

// 404 for anything that reached the API but matched no route.
export function notFound(req, res, next) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

// Central error handler — turns thrown errors into clean JSON.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details || null;

  // Friendly translations for common Sequelize errors.
  if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    message = 'That value is already in use';
    details = err.errors?.map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'SequelizeValidationError') {
    status = 400;
    message = 'Validation failed';
    details = err.errors?.map((e) => ({ field: e.path, message: e.message }));
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Uploaded file is too large';
  }

  if (status >= 500) {
    logger.error('%s %s -> %s', req.method, req.originalUrl, err.stack || err.message);
  } else {
    logger.warn('%s %s -> %d %s', req.method, req.originalUrl, status, message);
  }

  res.status(status).json({
    error: {
      message,
      ...(details ? { details } : {}),
      ...(env.isProd ? {} : { stack: err.stack }),
    },
  });
}
