import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Briefcase, Languages, BadgeCheck, Home, Building2, CalendarPlus,
  Clock, ArrowLeft, MessageSquareQuote, ShieldCheck, Heart, Star, CheckCircle2,
  Flag,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Avatar from '../../components/Avatar.jsx';
import StarRating from '../../components/StarRating.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Modal from '../../components/ui/Modal.jsx';
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
  const toast = useToast();
  const [caregiver, setCaregiver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

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

      <div className="mb-6 overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-care-50 shadow-card">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-7 md:flex-row md:items-center">
            <div className="relative shrink-0 self-center md:self-auto">
              <div className="overflow-hidden rounded-3xl ring-4 ring-white shadow-soft">
                {c.profilePhotoUrl ? (
                  <img src={c.profilePhotoUrl} alt={`${c.name} professional profile`} className="h-32 w-32 object-cover md:h-40 md:w-40" />
                ) : (
                  <Avatar name={c.name} size="xl" className="h-32 w-32 text-4xl md:h-40 md:w-40" />
                )}
              </div>
              {c.isAvailable && <span className="absolute bottom-1 right-1 inline-flex items-center gap-1.5 rounded-full border-4 border-white bg-care-500 px-3 py-1 text-xs font-bold text-white shadow-sm"><span className="h-2 w-2 rounded-full bg-white" /> Available</span>}
            </div>
            <div className="min-w-0 flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <Badge tone="brand" icon={ShieldCheck}>Verified caregiver</Badge>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-muted ring-1 ring-slate-200">SmartCare professional</span>
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{c.name}</h1>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-ink-muted md:justify-start">
                {c.city && <span className="flex items-center gap-1"><MapPin size={15} /> {c.city}</span>}
                {c.yearsExperience > 0 && <span className="flex items-center gap-1"><Briefcase size={15} /> {c.yearsExperience} years experience</span>}
                {c.languages && <span className="flex items-center gap-1"><Languages size={15} /> {c.languages}</span>}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                {c.totalReviews > 0 ? <StarRating value={c.avgRating} size={18} showValue count={c.totalReviews} /> : <span className="text-sm text-ink-muted">New caregiver</span>}
                {c.servesHome && <Badge tone="brand" icon={Home}>Home care</Badge>}
                {c.servesHospital && <Badge tone="care" icon={Building2}>Hospital care</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: main */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow">About the caregiver</p>
                  <h2 className="mt-1 text-xl font-bold">Professional profile</h2>
                </div>
                <Heart size={20} className="text-brand-400" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-surface-sunken p-4"><p className="text-xs text-ink-muted">Experience</p><p className="mt-1 font-bold text-ink">{c.yearsExperience || 0} years</p></div>
                <div className="rounded-2xl bg-surface-sunken p-4"><p className="text-xs text-ink-muted">Rating</p><p className="mt-1 font-bold text-ink">{c.totalReviews ? Number(c.avgRating).toFixed(1) : 'New'}</p></div>
                <div className="rounded-2xl bg-surface-sunken p-4"><p className="text-xs text-ink-muted">Availability</p><p className="mt-1 font-bold text-care-700">{c.isAvailable ? 'Available' : 'Unavailable'}</p></div>
              </div>
              {c.bio && <p className="mt-6 whitespace-pre-line leading-7 text-ink-soft">{c.bio}</p>}
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
            <CardHeader title="Why this profile is trusted" icon={ShieldCheck} />
            <CardBody>
              <div className="space-y-3">
                {(c.verification_checklist || []).filter(x => x.status === 'approved' || x.approved || x.verified).slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-xl bg-care-50 px-3 py-2.5 text-sm text-care-800">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-care-600" />
                    <span>{item.label || item.name || item.type || 'Verification check completed'}</span>
                  </div>
                ))}
                <p className="text-xs leading-5 text-ink-muted">SmartCare displays verification information based on documents reviewed by the platform.</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Verification" subtitle="Checks passed before listing" icon={BadgeCheck} />
            <CardBody>
              <VerificationChecklist items={c.verification_checklist || []} compact />
            </CardBody>
          </Card>

          {user && user.role === 'patient' && (
            <button onClick={() => setReportOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50">
              <Flag size={15} /> Report this caregiver
            </button>
          )}

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

      {reportOpen && (
        <ReportModal caregiverId={id} caregiverName={c.name} onClose={() => setReportOpen(false)} onDone={() => { setReportOpen(false); toast('Report submitted. Our team will review it.', 'info'); }} />
      )}
    </div>
  );
}

function ReportModal({ caregiverId, caregiverName, onClose, onDone }) {
  const [reason, setReason] = useState('inappropriate_behavior');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reasons = [
    { id: 'inappropriate_behavior', label: 'Inappropriate behavior' },
    { id: 'fraud', label: 'Fraud or scam' },
    { id: 'safety_concern', label: 'Safety concern' },
    { id: 'fake_profile', label: 'Fake profile' },
    { id: 'other', label: 'Other' },
  ];

  async function submit() {
    setLoading(true);
    setError('');
    try {
      await api.post('/reports', { reported_id: Number(caregiverId), reason, description: description.trim() || undefined });
      setSubmitted(true);
      setTimeout(onDone, 1500);
    } catch (e) {
      setError(errMsg(e, 'Could not submit your report.'));
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Modal open onClose={onClose} title="Report submitted" footer={<Button onClick={onDone}>Close</Button>}>
        <div className="text-center py-4">
          <CheckCircle2 size={40} className="mx-auto text-care-500 mb-3" />
          <p className="text-ink-soft">Thank you. Your report about {caregiverName} has been submitted for review.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open onClose={onClose} title="Report caregiver"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="outline" icon={Flag} loading={loading} onClick={submit}>Submit report</Button>
      </>}
    >
      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <p className="mb-4 text-sm text-ink-soft">Report <strong>{caregiverName}</strong> for a concern. Our team will review your report.</p>
      <div className="space-y-3">
        {reasons.map((r) => (
          <label key={r.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-brand-300">
            <input type="radio" name="report-reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} className="accent-brand-600" />
            <span className="text-sm font-medium text-ink-soft">{r.label}</span>
          </label>
        ))}
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional: add details about your concern…" className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
    </Modal>
  );
}
