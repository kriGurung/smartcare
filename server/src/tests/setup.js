// Runs before every test file. Env vars must be set BEFORE any module that
// reads them (config/env.js, config/database.js) is imported — Vitest
// evaluates setupFiles before the test file's imports.
process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_0123456789abcdef';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_0123456789abcdef';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';
process.env.FIELD_ENCRYPTION_KEY = 'c'.repeat(64);
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.ESEWA_ENABLED = 'false';
process.env.KHALTI_ENABLED = 'false';
