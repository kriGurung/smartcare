import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

// Digital care log / shift handover notes (§11) — caregiver records what
// was done each visit; patient/family can read for continuity of care.
class CareLog extends Model {}

CareLog.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    booking_id: { type: DataTypes.INTEGER, allowNull: false },
    caregiver_id: { type: DataTypes.INTEGER, allowNull: false },
    tasks_completed: { type: DataTypes.STRING(1000), allowNull: true },
    observations: { type: DataTypes.STRING(1000), allowNull: true },
    patient_mood: { type: DataTypes.ENUM('good', 'fair', 'poor'), allowNull: true },
    logged_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, modelName: 'CareLog', tableName: 'care_logs' }
);

export default CareLog;
