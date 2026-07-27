import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Briefcase, Languages, BadgeCheck, Home, Building2, CalendarPlus,
  Clock, ArrowLeft, MessageSquareQuote,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../../components/Avatar.jsx';
import StarRating from '../../components/StarRating.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import VerificationChecklist from '../../components/VerificationChecklist.jsx';
import { formatNpr, formatTime, formatDate } from '../../lib/format.js';
import { WEEKDAYS } from '../../lib/constants.js';

function SubRating({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-soft">{label}</span>
      <StarRating value={value} size={14} showValue />
    </div>
  );
}

export default function CaregiverProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caregiver, setCaregiver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/caregivers/${id}`)
      .then((r) => active && setCaregiver(r.data.caregiver))
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  function handleBook() {
    if (!user) return navigate('/login', { state: { from: { pathname: `/patient/book/${id}` } } });
    if (user.role === 'patient') return navigate(`/patient/book/${id}`);
  }

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-8"><Spinner label="Loading profile…" /></div>;
  if (notFound || !caregiver) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={BadgeCheck}
          title="Caregiver not available"
          message="This caregiver could not be found or is not currently verified."
          action={<Button as={Link} to="/find-caregivers">Browse caregivers</Button>}
        />
      </div>
    );
  }

  const c = caregiver;
  const canBook = !user || user.role === 'patient';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: main */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardBody>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <Avatar name={c.name} src={c.profilePhotoUrl || undefined} size="xl" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-ink">{c.name}</h1>
                    <Badge tone="brand" icon={BadgeCheck}>Verified</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                    {c.city && <span className="flex items-center gap-1"><MapPin size={15} /> {c.city}</span>}
                    {c.yearsExperience > 0 && <span className="flex items-center gap-1"><Briefcase size={15} /> {c.yearsExperience} yr experience</span>}
                    {c.languages && <span className="flex items-center gap-1"><Languages size={15} /> {c.languages}</span>}
                  </div>
                  <div className="mt-3">
                    {c.totalReviews > 0 ? (
                      <StarRating value={c.avgRating} size={18} showValue count={c.totalReviews} />
                    ) : (
                      <span className="text-sm text-ink-faint">No reviews yet</span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {c.servesHome && <Badge tone="brand" icon={Home}>Home visits</Badge>}
                    {c.servesHospital && <Badge tone="care" icon={Building2}>Hospital care</Badge>}
                  </div>
                </div>
              </div>
              {c.bio && <p className="mt-6 whitespace-pre-line text-ink-soft">{c.bio}</p>}
            </CardBody>
          </Card>

          {c.services?.length > 0 && (
            <Card>
              <CardHeader title="Services offered" />
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {c.services.map((s) => (
                    <span key={s.id} className="rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-medium text-brand-700">{s.name}</span>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <CardHeader title="Patient reviews" subtitle={c.totalReviews > 0 ? `${c.totalReviews} review${c.totalReviews !== 1 ? 's' : ''}` : undefined} icon={MessageSquareQuote} />
            <CardBody>
              {(!c.reviews || c.reviews.length === 0) ? (
                <p className="py-4 text-center text-sm text-ink-muted">No reviews yet — be the first to book.</p>
              ) : (
                <ul className="space-y-5">
                  {c.reviews.map((r) => (
                    <li key={r.id} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">{r.patientName}</span>
                        <span className="text-xs text-ink-faint">{formatDate(r.createdAt)}</span>
                      </div>
                      <div className="mt-1"><StarRating value={r.rating} size={15} /></div>
                      {r.comment && <p className="mt-2 text-sm text-ink-soft">{r.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right: sticky booking + trust */}
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-20">
            <CardBody>
              <p className="text-sm text-ink-muted">Hourly rate</p>
              <p className="text-3xl font-bold text-ink">
                {formatNpr(c.hourlyRatePaisa)}<span className="text-base font-medium text-ink-muted">/hr</span>
              </p>
              {canBook ? (
                <Button onClick={handleBook} size="lg" icon={CalendarPlus} className="mt-5 w-full">
                  {user ? 'Book this caregiver' : 'Sign in to book'}
                </Button>
              ) : (
                <p className="mt-5 rounded-xl bg-surface-sunken px-4 py-3 text-center text-sm text-ink-muted">
                  Bookings are made from a patient account.
                </p>
              )}
              <p className="mt-3 text-center text-xs text-ink-faint">On SmartCare since {formatDate(c.created_at)}</p>
            </CardBody>
          </Card>

          {c.totalReviews > 0 && (
            <Card>
              <CardHeader title="Rating breakdown" />
              <CardBody className="space-y-3">
                <SubRating label="Punctuality" value={c.subRatings?.punctuality || 0} />
                <SubRating label="Care quality" value={c.subRatings?.careQuality || 0} />
                <SubRating label="Communication" value={c.subRatings?.communication || 0} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Verification" subtitle="Checks passed before listing" icon={BadgeCheck} />
            <CardBody>
              <VerificationChecklist items={c.verification_checklist || []} compact />
            </CardBody>
          </Card>

          {c.availability?.length > 0 && (
            <Card>
              <CardHeader title="Weekly availability" icon={Clock} />
              <CardBody>
                <ul className="space-y-2">
                  {c.availability.map((a, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink-soft">{WEEKDAYS[a.day_of_week] ?? a.day_of_week}</span>
                      <span className="text-ink-muted">{formatTime(`1970-01-01T${a.start_time}`)} – {formatTime(`1970-01-01T${a.end_time}`)}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
