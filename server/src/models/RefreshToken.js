import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

// Persisted refresh tokens so logout can truly invalidate a session (§9.1).
class RefreshToken extends Model {}

RefreshToken.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    token: { type: DataTypes.STRING(512), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    revoked_at: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, modelName: 'RefreshToken', tableName: 'refresh_tokens', updatedAt: false }
);

export default RefreshToken;
