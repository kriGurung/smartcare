import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class CaregiverAvailability extends Model {}

CaregiverAvailability.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    caregiver_id: { type: DataTypes.INTEGER, allowNull: false },
    // 0 = Sunday ... 6 = Saturday (recurring weekly availability).
    day_of_week: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0, max: 6 } },
    start_time: { type: DataTypes.STRING(5), allowNull: false }, // "09:00"
    end_time: { type: DataTypes.STRING(5), allowNull: false },   // "17:00"
    is_recurring: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, modelName: 'CaregiverAvailability', tableName: 'caregiver_availability' }
);

export default CaregiverAvailability;
