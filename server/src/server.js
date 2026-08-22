import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import { ensureDatabaseExists, testConnection, sequelize } from './config/database.js';
import { User } from './models/index.js';
import { runSeed } from './utils/seed.js';

async function start() {
  try {
    // 1. Make sure the `smartcare` schema exists (Laragon ships none by default).
    await ensureDatabaseExists();

    // 2. Connect.
    await testConnection();

    // 3. Sync models -> tables.
    //    DB_SYNC overrides the default: "alter" (dev default — apply schema
    //    tweaks automatically), "force" (drop & recreate — destructive),
    //    or "safe" (create missing tables only; recommended default).
    // Keep schema changes non-destructive by default. Use DB_SYNC=alter only when
    // intentionally applying model changes to a disposable/local database.
    const syncMode = process.env.DB_SYNC || 'safe';
    if (syncMode === 'force') await sequelize.sync({ force: true });
    else if (syncMode === 'alter') await sequelize.sync({ alter: true });
    else await sequelize.sync();
    logger.info(`Database schema synced (mode: ${syncMode}).`);

    // 4. First run? Seed demo data (admin, caregivers, patient, services).
    const userCount = await User.count();
    if (userCount === 0) {
      logger.info('Empty database detected — seeding demo data...');
      await runSeed({ silent: true });
    }

    // 5. Listen.
    app.listen(env.port, () => {
      logger.info(`SmartCare API listening on http://localhost:${env.port}`);
      logger.info(`Allowing client origin: ${env.clientOrigin}`);
      if (!env.isProd) logger.info('Health check: http://localhost:' + env.port + '/api/health');
    });
  } catch (err) {
    logger.error('Failed to start SmartCare API: %s', err.stack || err.message);
    if (/ECONNREFUSED|ER_ACCESS_DENIED|ENOTFOUND/.test(err.message)) {
      logger.error(
        'Could not reach MySQL. Is Laragon running and MySQL started? ' +
          'Check DB_HOST/DB_PORT/DB_USER/DB_PASSWORD in server/.env'
      );
    }
    process.exit(1);
  }
}

start();

// Graceful shutdown.
process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await sequelize.close();
  process.exit(0);
});
