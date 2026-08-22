import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { VERIFICATION_STATUS } from '../config/constants.js';

class CaregiverProfile extends Model {}

CaregiverProfile.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    years_experience: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    // Money stored as integer paisa (1 NPR = 100 paisa) to avoid float rounding (§7).
    hourly_rate_paisa: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    verification_status: {
      type: DataTypes.ENUM(...Object.values(VERIFICATION_STATUS)),
      allowNull: false,
      defaultValue: VERIFICATION_STATUS.PENDING,
    },
    rejection_reason: { type: DataTypes.STRING(500), allowNull: true },
    verified_by: { type: DataTypes.INTEGER, allowNull: true },
    verified_at: { type: DataTypes.DATE, allowNull: true },
    avg_rating: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
    total_reviews: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    // Sub-rating averages (§11 richer trust signal).
    avg_punctuality: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
    avg_care_quality: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
    avg_communication: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
    profile_photo_url: { type: DataTypes.STRING(300), allowNull: true },
    city: { type: DataTypes.STRING(80), allowNull: true },
    gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: true },
    languages: { type: DataTypes.STRING(160), allowNull: true }, // e.g. "Nepali, English"
    // Which location types this caregiver offers (§6.2 home/hospital filter).
    serves_home: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    serves_hospital: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_available: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }, // accepting new jobs
  },
  { sequelize, modelName: 'CaregiverProfile', tableName: 'caregiver_profiles' }
);

export default CaregiverProfile;
