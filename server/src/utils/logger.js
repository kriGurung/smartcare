import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

const logger = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'smartcare-api' },
  // Under test we skip disk transports — the suite is noisy enough and the
  // temp logs dir just gets littered. Errors still surface on the console.
  transports:
    process.env.NODE_ENV === 'test'
      ? []
      : [
          // Local replacement for AWS CloudWatch: rotating-ish files on disk.
          new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error', maxsize: 5_000_000, maxFiles: 3 }),
          new winston.transports.File({ filename: path.join(logDir, 'combined.log'), maxsize: 5_000_000, maxFiles: 3 }),
        ],
});

// Pretty console output in development.
if (process.env.NODE_ENV === 'test') {
  logger.add(
    new winston.transports.Console({
      level: 'error',
      format: winston.format.simple(),
    })
  );
} else if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, stack }) =>
          `${timestamp} ${level}: ${stack || message}`
        )
      ),
    })
  );
}

export default logger;
