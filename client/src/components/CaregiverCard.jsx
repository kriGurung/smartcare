import { Link } from 'react-router-dom';
import { MapPin, Home, Building2, BadgeCheck, Briefcase } from 'lucide-react';
import Avatar from './Avatar.jsx';
import StarRating from './StarRating.jsx';
import Badge from './ui/Badge.jsx';
import { formatNpr } from '../lib/format.js';

export default function CaregiverCard({ caregiver: c }) {
  return (
    <Link
      to={`/caregivers/${c.id}`}
      className="card-base group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start gap-4">
        <Avatar name={c.name} src={c.profilePhotoUrl ? c.profilePhotoUrl : undefined} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-lg font-semibold text-ink">{c.name}</h3>
            <BadgeCheck size={18} className="shrink-0 text-brand-600" title="Verified caregiver" />
          </div>
          {c.city && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-muted">
              <MapPin size={14} /> {c.city}
            </p>
          )}
          <div className="mt-1.5">
            {c.totalReviews > 0 ? (
              <StarRating value={c.avgRating} size={15} showValue count={c.totalReviews} />
            ) : (
              <span className="text-sm text-ink-faint">New caregiver</span>
            )}
          </div>
        </div>
      </div>

      {c.bio && <p className="mt-4 line-clamp-2 text-sm text-ink-soft">{c.bio}</p>}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {c.yearsExperience > 0 && (
          <Badge tone="muted" icon={Briefcase}>{c.yearsExperience} yr exp</Badge>
        )}
        {c.servesHome && <Badge tone="brand" icon={Home}>Home</Badge>}
        {c.servesHospital && <Badge tone="care" icon={Building2}>Hospital</Badge>}
      </div>

      {c.services?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.services.slice(0, 3).map((s) => (
            <span key={s.id} className="rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-medium text-ink-soft">
              {s.name}
            </span>
          ))}
          {c.services.length > 3 && (
            <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-medium text-ink-muted">
              +{c.services.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex items-end justify-between pt-5">
        <div>
          <p className="text-xs text-ink-muted">From</p>
          <p className="text-xl font-bold text-ink">
            {formatNpr(c.hourlyRatePaisa)}
            <span className="text-sm font-medium text-ink-muted">/hr</span>
          </p>
        </div>
        <span className="rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
          View profile
        </span>
      </div>
    </Link>
  );
}
