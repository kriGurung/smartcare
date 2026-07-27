import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { encryptField, decryptField } from '../utils/crypto.js';

class PatientProfile extends Model {}

PatientProfile.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    address: { type: DataTypes.STRING(300), allowNull: true },
    city: { type: DataTypes.STRING(80), allowNull: true },
    emergency_contact: { type: DataTypes.STRING(20), allowNull: true },
    // Health-adjacent free text — encrypted at rest (§9.3).
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      set(v) { this.setDataValue('notes', encryptField(v)); },
      get() { return decryptField(this.getDataValue('notes')); },
    },
  },
  { sequelize, modelName: 'PatientProfile', tableName: 'patient_profiles' }
);

export default PatientProfile;
