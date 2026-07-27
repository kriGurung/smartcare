import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { DOC_TYPES, DOC_STATUS } from '../config/constants.js';

class CaregiverDocument extends Model {}

CaregiverDocument.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    caregiver_id: { type: DataTypes.INTEGER, allowNull: false },
    doc_type: { type: DataTypes.ENUM(...Object.values(DOC_TYPES)), allowNull: false },
    // Stored as an internal path; served only via an authenticated download route
    // (the local equivalent of a private S3 bucket + signed URL, §9.5).
    file_path: { type: DataTypes.STRING(300), allowNull: false },
    original_name: { type: DataTypes.STRING(200), allowNull: true },
    mime_type: { type: DataTypes.STRING(80), allowNull: true },
    status: {
      type: DataTypes.ENUM(...Object.values(DOC_STATUS)),
      allowNull: false,
      defaultValue: DOC_STATUS.PENDING,
    },
    review_note: { type: DataTypes.STRING(400), allowNull: true },
  },
  { sequelize, modelName: 'CaregiverDocument', tableName: 'caregiver_documents' }
);

export default CaregiverDocument;
