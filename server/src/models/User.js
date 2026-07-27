import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import env from '../config/env.js';
import { ROLES, USER_STATUS } from '../config/constants.js';

class User extends Model {
  async comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password_hash);
  }

  // Never leak the password hash (or transient plaintext) to clients.
  toSafeJSON() {
    const { password_hash, password, ...rest } = this.get({ plain: true });
    return rest;
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true } },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
      set(v) { this.setDataValue('email', String(v).toLowerCase().trim()); },
    },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    password_hash: { type: DataTypes.STRING(100), allowNull: false },
    // Transient plaintext — set this then save() to trigger hashing; never persisted.
    password: { type: DataTypes.VIRTUAL, allowNull: true },
    role: {
      type: DataTypes.ENUM(...Object.values(ROLES)),
      allowNull: false,
      defaultValue: ROLES.PATIENT,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(USER_STATUS)),
      allowNull: false,
      defaultValue: USER_STATUS.ACTIVE,
    },
    language_pref: { type: DataTypes.STRING(5), allowNull: false, defaultValue: 'en' },
    // Brute-force protection (§9.1 account lockout).
    failed_login_attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lock_until: { type: DataTypes.DATE, allowNull: true },
    consent_accepted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      // Hash the transient plaintext password (if provided) BEFORE validation,
      // so the not-null check on password_hash sees the freshly hashed value.
      beforeValidate: async (user) => {
        if (user.password) {
          user.password_hash = await bcrypt.hash(user.password, env.bcryptRounds);
          user.password = null;
        }
      },
    },
  }
);

export default User;
