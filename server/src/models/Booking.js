import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';
import { LOCATION_TYPE, BOOKING_STATUS } from '../config/constants.js';

class Booking extends Model {}

Booking.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    caregiver_id: { type: DataTypes.INTEGER, allowNull: false },
    service_id: { type: DataTypes.INTEGER, allowNull: true },
    location_type: { type: DataTypes.ENUM(...Object.values(LOCATION_TYPE)), allowNull: false },
    address: { type: DataTypes.STRING(300), allowNull: false },
    hospital_name: { type: DataTypes.STRING(160), allowNull: true },
    start_datetime: { type: DataTypes.DATE, allowNull: false },
    end_datetime: { type: DataTypes.DATE, allowNull: false },
    hours: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    hourly_rate_paisa: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    total_amount_paisa: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    commission_paisa: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    caregiver_earning_paisa: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM(...Object.values(BOOKING_STATUS)),
      allowNull: false,
      defaultValue: BOOKING_STATUS.PENDING,
    },
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    check_in_at: { type: DataTypes.DATE, allowNull: true },
    check_in_lat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    check_in_lng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    check_in_distance_m: { type: DataTypes.INTEGER, allowNull: true },
    check_in_outside_perimeter: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    check_in_override_reason: { type: DataTypes.STRING(300), allowNull: true },
    check_out_at: { type: DataTypes.DATE, allowNull: true },
    check_out_lat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    check_out_lng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    patient_note: { type: DataTypes.STRING(500), allowNull: true },
    decline_reason: { type: DataTypes.STRING(300), allowNull: true },
    cancelled_by: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, modelName: 'Booking', tableName: 'bookings' }
);

export default Booking;
