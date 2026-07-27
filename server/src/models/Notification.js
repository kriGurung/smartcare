import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';

class Notification extends Model {}

Notification.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM(...Object.values(NOTIFICATION_TYPES)), allowNull: false },
    title: { type: DataTypes.STRING(160), allowNull: false },
    message: { type: DataTypes.STRING(500), allowNull: false },
    link: { type: DataTypes.STRING(200), allowNull: true },
    is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, modelName: 'Notification', tableName: 'notifications' }
);

export default Notification;
