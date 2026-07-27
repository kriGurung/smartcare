import { AuditLog } from '../models/index.js';
import logger from '../utils/logger.js';

// Records a sensitive action to the audit_logs table (§9.7). Never throws
// into the request path — an audit failure must not break the operation.
export async function recordAudit({ userId = null, action, resource = null, meta = null, ip = null }) {
  try {
    await AuditLog.create({ user_id: userId, action, resource, meta, ip_address: ip });
  } catch (err) {
    logger.error('Audit log failed for action "%s": %s', action, err.message);
  }
}
