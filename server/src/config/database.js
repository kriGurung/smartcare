import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './env.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isSqlite = env.db.dialect === 'sqlite';

const common = {
  dialect: env.db.dialect,
  logging: env.isProd ? false : (msg) => logger.debug(msg),
  define: {
    underscored: true, // created_at, user_id, etc. — matches the schema in the plan
    freezeTableName: false,
  },
};

// MySQL (Laragon) is the primary target. SQLite is offered only as a
// zero-install fallback for quick trials — set DB_DIALECT=sqlite.
export const sequelize = isSqlite
  ? new Sequelize({
      ...common,
      storage: path.resolve(__dirname, '../../', process.env.DB_STORAGE || 'smartcare.sqlite'),
    })
  : new Sequelize(env.db.name, env.db.user, env.db.password, {
      ...common,
      host: env.db.host,
      port: env.db.port,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    });

/**
 * Ensures the target database exists before Sequelize connects to it.
 * Laragon ships MySQL with a root/no-password account, so a brand-new
 * install won't have the `smartcare` schema yet — this creates it.
 */
export async function ensureDatabaseExists() {
  if (isSqlite) return; // file-based DB — nothing to pre-create
  const mysql = await import('mysql2/promise');
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
  });
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await conn.end();
  logger.info(`Database "${env.db.name}" is ready.`);
}

export async function testConnection() {
  await sequelize.authenticate();
  logger.info(`Database connection established (${env.db.dialect}).`);
}

export default sequelize;
