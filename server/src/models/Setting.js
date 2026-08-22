import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

// Simple key-value store for admin-editable platform settings
// (commission rate, banner/notice text, etc. — §6.4 Platform settings).
class Setting extends Model {}

Setting.init(
  {
    key: { type: DataTypes.STRING(80), primaryKey: true },
    value: { type: DataTypes.JSON, allowNull: true },
  },
  { sequelize, modelName: 'Setting', tableName: 'settings' }
);

export default Setting;
