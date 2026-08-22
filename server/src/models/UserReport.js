import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const REPORT_STATUS = ['pending', 'reviewed', 'dismissed'];

const UserReport = sequelize.define('UserReport', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reporter_id: { type: DataTypes.INTEGER, allowNull: false },
  reported_id: { type: DataTypes.INTEGER, allowNull: false },
  reason: {
    type: DataTypes.ENUM('inappropriate_behavior', 'fraud', 'safety_concern', 'fake_profile', 'other'),
    allowNull: false,
  },
  description: { type: DataTypes.STRING(1000), allowNull: true },
  status: { type: DataTypes.ENUM(...REPORT_STATUS), defaultValue: 'pending' },
  reviewed_by: { type: DataTypes.INTEGER, allowNull: true },
  reviewed_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'user_reports',
  underscored: true,
  timestamps: true,
});

export default UserReport;
