// Client-side mirrors of server enums + display metadata (labels, colours, icons).

export const BOOKING_STATUS_META = {
  pending: { label: 'Pending', tone: 'warning', desc: 'Awaiting caregiver acceptance' },
  confirmed: { label: 'Confirmed', tone: 'brand', desc: 'Accepted — ready for payment' },
  in_progress: { label: 'In progress', tone: 'care', desc: 'Visit under way' },
  completed: { label: 'Completed', tone: 'success', desc: 'Visit finished' },
  cancelled: { label: 'Cancelled', tone: 'muted', desc: 'Cancelled by patient' },
  declined: { label: 'Declined', tone: 'danger', desc: 'Declined by caregiver' },
};

export const PAYMENT_STATUS_META = {
  pending: { label: 'Pending', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'muted' },
};

export const VERIFICATION_META = {
  pending: { label: 'Pending review', tone: 'warning' },
  verified: { label: 'Verified', tone: 'success' },
  rejected: { label: 'Needs attention', tone: 'danger' },
  missing: { label: 'Not submitted', tone: 'muted' },
  approved: { label: 'Approved', tone: 'success' },
};

export const PAYMENT_METHODS = [
  { id: 'esewa', name: 'eSewa', blurb: 'Pay instantly with your eSewa wallet', color: '#60BB46' },
  { id: 'khalti', name: 'Khalti', blurb: 'Pay with Khalti digital wallet', color: '#5C2D91' },
  { id: 'bank', name: 'Bank transfer', blurb: 'Transfer to SmartCare bank account', color: '#2563EB' },
  { id: 'cash', name: 'Cash on visit', blurb: 'Pay the caregiver directly in cash', color: '#64748B' },
];

export const DOC_TYPES = [
  { id: 'citizenship', label: 'Citizenship / National ID' },
  { id: 'certificate', label: 'Training Certificate' },
  { id: 'police_report', label: 'Police Clearance' },
];

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Icon name (lucide) per service, matched loosely by keyword.
export function serviceIcon(name = '') {
  const n = name.toLowerCase();
  if (n.includes('elder')) return 'Users';
  if (n.includes('surgery')) return 'Stethoscope';
  if (n.includes('hospital')) return 'BedDouble';
  if (n.includes('disab')) return 'Accessibility';
  if (n.includes('palliat')) return 'HeartHandshake';
  if (n.includes('matern') || n.includes('newborn')) return 'Baby';
  if (n.includes('physio')) return 'Activity';
  if (n.includes('medic')) return 'Pill';
  return 'HandHeart';
}
