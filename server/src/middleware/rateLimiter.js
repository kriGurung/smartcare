import rateLimit from 'express-rate-limit';

const message = { error: { message: 'Too many requests. Please slow down and try again shortly.' } };

// Limiters are disabled under test so the suite can hammer the API freely;
// the production/dev behaviour is unchanged.
const inTest = () => process.env.NODE_ENV === 'test';

// Tight limit on auth endpoints — brute-force protection (§9.7).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message,
  skip: inTest,
});

// Looser limit on search so browsing stays smooth.
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message,
  skip: inTest,
});

// Review submission limiter to stop spam.
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message,
  skip: inTest,
});

// General API safety net.
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message,
  skip: inTest,
});
