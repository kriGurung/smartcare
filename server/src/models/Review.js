import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Review extends Model {}

Review.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    booking_id: { type: DataTypes.INTEGER, allowNull: false, unique: true }, // one review per completed booking
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    caregiver_id: { type: DataTypes.INTEGER, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
    // Sub-ratings (§11).
    punctuality: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
    care_quality: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
    communication: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
    comment: { type: DataTypes.STRING(1000), allowNull: true },
    is_hidden: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // admin moderation
  },
  { sequelize, modelName: 'Review', tableName: 'reviews' }
);

export default Review;
