// Central place for enums so controllers, models, and the client stay in sync.

export const ROLES = Object.freeze({
  PATIENT: 'patient',
  CAREGIVER: 'caregiver',
  ADMIN: 'admin',
});

export const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
});

export const VERIFICATION_STATUS = Object.freeze({
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
});

export const DOC_TYPES = Object.freeze({
  CITIZENSHIP: 'citizenship',
  CERTIFICATE: 'certificate',
  POLICE_REPORT: 'police_report',
});

export const DOC_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const LOCATION_TYPE = Object.freeze({
  HOME: 'home',
  HOSPITAL: 'hospital',
});

export const BOOKING_STATUS = Object.freeze({
  PENDING: 'pending', // awaiting caregiver acceptance
  CONFIRMED: 'confirmed', // caregiver accepted, awaiting/settled payment
  IN_PROGRESS: 'in_progress', // visit under way
  COMPLETED: 'completed', // visit finished — enables review
  CANCELLED: 'cancelled',
  DECLINED: 'declined',
});

export const PAYMENT_METHODS = Object.freeze({
  ESEWA: 'esewa',
  KHALTI: 'khalti',
  BANK: 'bank',
  CASH: 'cash',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

export const NOTIFICATION_TYPES = Object.freeze({
  BOOKING: 'booking',
  PAYMENT: 'payment',
  VERIFICATION: 'verification',
  REVIEW: 'review',
  SYSTEM: 'system',
});

// Default platform commission (percent). Editable by Admin in Settings.
export const DEFAULT_COMMISSION_PERCENT = 10;

export const SERVICE_CATALOGUE = [
  { name: 'Elderly Care', description: 'Daily living assistance, mobility, and companionship for seniors.' },
  { name: 'Post-Surgery Care', description: 'Recovery support, wound care assistance, and medication reminders.' },
  { name: 'Hospital Sitter', description: 'Bedside attendance and support for admitted patients.' },
  { name: 'Disability Support', description: 'Personal care and daily assistance for people with disabilities.' },
  { name: 'Palliative Care', description: 'Comfort-focused care for patients with serious illness.' },
  { name: 'Maternity & Newborn', description: 'Support for new mothers and newborn care at home.' },
  { name: 'Physiotherapy Assist', description: 'Assistance with prescribed physiotherapy exercises at home.' },
  { name: 'Medication Management', description: 'Scheduling, reminders, and administration support.' },
];
