import sequelize from '../config/database.js';
import User from './User.js';
import CaregiverProfile from './CaregiverProfile.js';
import PatientProfile from './PatientProfile.js';
import Service from './Service.js';
import CaregiverDocument from './CaregiverDocument.js';
import CaregiverAvailability from './CaregiverAvailability.js';
import Booking from './Booking.js';
import Payment from './Payment.js';
import Review from './Review.js';
import Notification from './Notification.js';
import CareLog from './CareLog.js';
import AuditLog from './AuditLog.js';
import RefreshToken from './RefreshToken.js';
import Setting from './Setting.js';
import UserReport from './UserReport.js';

// ── Profiles ──────────────────────────────────────────────
User.hasOne(CaregiverProfile, { foreignKey: 'user_id', as: 'caregiverProfile', onDelete: 'CASCADE' });
CaregiverProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(PatientProfile, { foreignKey: 'user_id', as: 'patientProfile', onDelete: 'CASCADE' });
PatientProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Admin who verified a caregiver.
CaregiverProfile.belongsTo(User, { foreignKey: 'verified_by', as: 'verifier' });

// ── Caregiver <-> Services (many-to-many) ─────────────────
User.belongsToMany(Service, {
  through: 'caregiver_services',
  foreignKey: 'caregiver_id',
  otherKey: 'service_id',
  as: 'services',
});
Service.belongsToMany(User, {
  through: 'caregiver_services',
  foreignKey: 'service_id',
  otherKey: 'caregiver_id',
  as: 'caregivers',
});

// ── Documents & availability ──────────────────────────────
User.hasMany(CaregiverDocument, { foreignKey: 'caregiver_id', as: 'documents', onDelete: 'CASCADE' });
CaregiverDocument.belongsTo(User, { foreignKey: 'caregiver_id', as: 'caregiver' });

User.hasMany(CaregiverAvailability, { foreignKey: 'caregiver_id', as: 'availability', onDelete: 'CASCADE' });
CaregiverAvailability.belongsTo(User, { foreignKey: 'caregiver_id', as: 'caregiver' });

// ── Bookings ──────────────────────────────────────────────
Booking.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });
Booking.belongsTo(User, { foreignKey: 'caregiver_id', as: 'caregiver' });
Booking.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
User.hasMany(Booking, { foreignKey: 'patient_id', as: 'patientBookings' });
User.hasMany(Booking, { foreignKey: 'caregiver_id', as: 'caregiverBookings' });

// ── Payments ──────────────────────────────────────────────
Booking.hasMany(Payment, { foreignKey: 'booking_id', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// ── Reviews ───────────────────────────────────────────────
Booking.hasOne(Review, { foreignKey: 'booking_id', as: 'review', onDelete: 'CASCADE' });
Review.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });
Review.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });
Review.belongsTo(User, { foreignKey: 'caregiver_id', as: 'caregiver' });
User.hasMany(Review, { foreignKey: 'caregiver_id', as: 'receivedReviews' });

// ── Care logs ─────────────────────────────────────────────
Booking.hasMany(CareLog, { foreignKey: 'booking_id', as: 'careLogs', onDelete: 'CASCADE' });
CareLog.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });
CareLog.belongsTo(User, { foreignKey: 'caregiver_id', as: 'caregiver' });

// ── Notifications & tokens ────────────────────────────────
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── User reports (flag / moderation) ──────────────────────
User.hasMany(UserReport, { foreignKey: 'reporter_id', as: 'reportsFiled' });
User.hasMany(UserReport, { foreignKey: 'reported_id', as: 'reportsReceived' });
UserReport.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });
UserReport.belongsTo(User, { foreignKey: 'reported_id', as: 'reported' });

const db = {
  sequelize,
  User,
  CaregiverProfile,
  PatientProfile,
  Service,
  CaregiverDocument,
  CaregiverAvailability,
  Booking,
  Payment,
  Review,
  Notification,
  CareLog,
  AuditLog,
  RefreshToken,
  Setting,
  UserReport,
};

export {
  sequelize,
  User,
  CaregiverProfile,
  PatientProfile,
  Service,
  CaregiverDocument,
  CaregiverAvailability,
  Booking,
  Payment,
  Review,
  Notification,
  CareLog,
  AuditLog,
  RefreshToken,
  Setting,
  UserReport,
};

export default db;
