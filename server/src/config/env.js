import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the server root regardless of where node is launched from.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const asBool = (v, def = false) =>
  v === undefined ? def : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'smartcare',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: process.env.DB_DIALECT || 'mysql',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),

  upload: {
    dir: process.env.UPLOAD_DIR || 'src/uploads',
    maxMb: parseInt(process.env.MAX_UPLOAD_MB || '5', 10),
  },

  fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY || '',

  payments: {
    esewa: {
      enabled: asBool(process.env.ESEWA_ENABLED),
      merchantCode: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
      secret: process.env.ESEWA_SECRET || '',
    },
    khalti: {
      enabled: asBool(process.env.KHALTI_ENABLED),
      secretKey: process.env.KHALTI_SECRET_KEY || '',
    },
  },

  mail: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'SmartCare <no-reply@smartcare.local>',
  },

  sms: {
    token: process.env.SMS_TOKEN || '',
    from: process.env.SMS_FROM || 'SmartCare',
  },
};

export default env;
