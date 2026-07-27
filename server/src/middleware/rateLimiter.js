import rateLimit from 'express-rate-limit';

const message = { error: { message: 'Too many requests. Please slow down and try again shortly.' } };

// Tight limit on auth endpoints — brute-force protection (§9.7).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

// Looser limit on search so browsing stays smooth.
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

// Review submission limiter to stop spam.
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

// General API safety net.
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});
