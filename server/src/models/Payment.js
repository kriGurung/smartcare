import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../config/constants.js';

class Payment extends Model {}

Payment.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    booking_id: { type: DataTypes.INTEGER, allowNull: false },
    amount_paisa: { type: DataTypes.INTEGER, allowNull: false },
    method: { type: DataTypes.ENUM(...Object.values(PAYMENT_METHODS)), allowNull: false },
    status: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
      allowNull: false,
      defaultValue: PAYMENT_STATUS.PENDING,
    },
    transaction_ref: { type: DataTypes.STRING(120), allowNull: true },
    gateway_ref: { type: DataTypes.STRING(160), allowNull: true },
    // Idempotency key prevents double-charging on retries (§9.6).
    idempotency_key: { type: DataTypes.STRING(80), allowNull: true, unique: true },
    paid_at: { type: DataTypes.DATE, allowNull: true },
    refunded_at: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, modelName: 'Payment', tableName: 'payments' }
);

export default Payment;
