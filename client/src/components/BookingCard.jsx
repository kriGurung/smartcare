import { Link } from 'react-router-dom';
import { MapPin, Building2, Clock, User, ChevronRight } from 'lucide-react';
import Avatar from './Avatar.jsx';
import StatusBadge from './StatusBadge.jsx';
import { formatDateTime, formatNpr, formatHours } from '../lib/format.js';

// Role-aware booking summary. `perspective` decides which party to feature
// and where the card links to.
export default function BookingCard({ booking: b, perspective = 'patient' }) {
  const other = perspective === 'caregiver' ? b.patient : b.caregiver;
  const otherLabel = perspective === 'caregiver' ? 'Patient' : 'Caregiver';
  const to =
    perspective === 'caregiver' ? `/caregiver/requests/${b.id}`
    : perspective === 'admin' ? `/admin/bookings/${b.id}`
    : `/patient/bookings/${b.id}`;

  return (
    <Link to={to} className="card-base group block p-5 transition hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={other?.name} size="md" />
          <div>
            <p className="text-xs text-ink-muted">{otherLabel}</p>
            <p className="font-semibold text-ink">{other?.name || '—'}</p>
          </div>
        </div>
        <StatusBadge kind="booking" status={b.status} />
      </div>

      <div className="mt-4 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
        <span className="flex items-center gap-2"><Clock size={15} className="text-ink-faint" /> {formatDateTime(b.start_datetime)}</span>
        <span className="flex items-center gap-2">
          {b.location_type === 'hospital' ? <Building2 size={15} className="text-ink-faint" /> : <MapPin size={15} className="text-ink-faint" />}
          {b.location_type === 'hospital' ? (b.hospital_name || 'Hospital') : 'Home visit'}
        </span>
        {b.service && <span className="flex items-center gap-2"><User size={15} className="text-ink-faint" /> {b.service.name}</span>}
        <span className="flex items-center gap-2"><Clock size={15} className="text-ink-faint" /> {formatHours(Number(b.hours))}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-lg font-bold text-ink">{formatNpr(b.total_amount_paisa)}</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2">
          Details <ChevronRight size={16} />
        </span>
      </div>
    </Link>
  );
}
