import Badge from './ui/Badge.jsx';
import { BOOKING_STATUS_META, PAYMENT_STATUS_META, VERIFICATION_META } from '../lib/constants.js';

const MAPS = { booking: BOOKING_STATUS_META, payment: PAYMENT_STATUS_META, verification: VERIFICATION_META };

export default function StatusBadge({ kind = 'booking', status, className = '' }) {
  const meta = MAPS[kind]?.[status];
  if (!meta) return <Badge className={className}>{status}</Badge>;
  return <Badge tone={meta.tone} className={className}>{meta.label}</Badge>;
}
