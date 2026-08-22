import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

// Generic audit trail (§9.7) — logins, verification decisions, payment
// events, admin overrides, suspensions. action + resource stay generic.
class AuditLog extends Model {}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING(80), allowNull: false },
    resource: { type: DataTypes.STRING(120), allowNull: true },
    meta: { type: DataTypes.JSON, allowNull: true },
    ip_address: { type: DataTypes.STRING(64), allowNull: true },
  },
  { sequelize, modelName: 'AuditLog', tableName: 'audit_logs', updatedAt: false }
);

export default AuditLog;
