import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from './config/env.js';
import logger from './utils/logger.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();

// Trust the reverse proxy / localhost so req.ip and rate limiting work correctly.
app.set('trust proxy', 1);

// Security headers (§9.4). crossOriginResourcePolicy relaxed so the React
// dev server on :5173 can load profile photos served from the API on :5000.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // the sandbox checkout page uses a tiny inline script
  })
);

// CORS — allow the React client with credentials (refresh-token cookie).
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// HTTP request logging into winston.
app.use(
  morgan(env.isProd ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http?.(msg.trim()) ?? logger.info(msg.trim()) },
  })
);

app.use('/api', globalLimiter);
app.use('/api', apiRoutes);

// Friendly root.
app.get('/', (req, res) =>
  res.json({
    name: 'SmartCare API',
    docs: '/api/health',
    message: 'Verified caregiver rental platform — API is running.',
  })
);

app.use(notFound);
app.use(errorHandler);

export default app;
