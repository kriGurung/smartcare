import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Home, Building2, Check, CalendarClock, MapPin,
  ClipboardCheck, Loader2, Navigation,
} from 'lucide-react';
import api, { errMsg } from '../../services/api.js';
import { getCurrentPosition } from '../../lib/geolocation.js';
import Avatar from '../../components/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import { Input, Textarea, Label } from '../../components/ui/Field.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import StarRating from '../../components/StarRating.jsx';
import { formatNpr, formatHours } from '../../lib/format.js';

const STEPS = ['Service & place', 'Date & time', 'Review'];

// Default to the next round hour for a friendlier starting point.
function defaultStart() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return toLocalInput(d);
}
function todayLocalInput() {
  const d = new Date();
  return toLocalInput(d);
}

function toLocalInput(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BookingFlow() {
  const { caregiverId } = useParams();
  const navigate = useNavigate();
  const [caregiver, setCaregiver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    service_id: '',
    location_type: '',
    address: '',
    hospital_name: '',
    start: defaultStart(),
    end: '',
    patient_note: '',
  });
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    api.get(`/caregivers/${caregiverId}`)
      .then((r) => {
        const c = r.data.caregiver;
        setCaregiver(c);
        setForm((f) => ({ ...f, location_type: c.servesHome ? 'home' : c.servesHospital ? 'hospital' : 'home' }));
      })
      .catch(() => setError('This caregiver is not available for booking.'))
      .finally(() => setLoading(false));
  }, [caregiverId]);

  const hours = useMemo(() => {
    if (!form.start || !form.end) return 0;
    const s = new Date(form.start);
    const e = new Date(form.end);
    const diff = (e - s) / (1000 * 60 * 60);
    return diff > 0 ? Math.round(diff * 100) / 100 : 0;
  }, [form.start, form.end]);

  const estimatedTotal = caregiver ? Math.round(hours * caregiver.hourlyRatePaisa) : 0;

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function pinLocation() {
    setGeoLoading(true);
    setGeoError('');
    try {
      const pos = await getCurrentPosition();
      setLatitude(pos.latitude);
      setLongitude(pos.longitude);
    } catch (e) {
      setGeoError(e.message);
    } finally {
      setGeoLoading(false);
    }
  }

  function validateStep() {
    setError('');
    if (step === 0) {
      if (!form.location_type) return 'Please choose a care location.';
      if (!form.address.trim() || form.address.trim().length < 3) return 'Please enter a full address.';
      if (form.location_type === 'hospital' && !form.hospital_name.trim()) return 'Please enter the hospital name.';
    }
    if (step === 1) {
      if (!form.start || !form.end) return 'Please choose a start and end time.';
      if (new Date(form.start) < new Date()) return 'Start time cannot be in the past.';
      if (new Date(form.end) <= new Date(form.start)) return 'End time must be after the start time.';
    }
    return '';
  }

  function next() {
    const msg = validateStep();
    if (msg) return setError(msg);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() { setError(''); setStep((s) => Math.max(s - 1, 0)); }

  async function submit() {
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        caregiver_id: Number(caregiverId),
        service_id: form.service_id ? Number(form.service_id) : undefined,
        location_type: form.location_type,
        address: form.address.trim(),
        hospital_name: form.location_type === 'hospital' ? form.hospital_name.trim() : undefined,
        start_datetime: new Date(form.start).toISOString(),
        end_datetime: new Date(form.end).toISOString(),
        patient_note: form.patient_note.trim() || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
      };
      const res = await api.post('/bookings', payload);
      navigate(`/patient/bookings/${res.data.booking.id}`, { replace: true });
    } catch (e) {
      setError(errMsg(e, 'Could not create the booking.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner label="Loading caregiver…" />;
  if (!caregiver) {
    return (
      <Card><CardBody>
        <p className="text-center text-ink-muted">{error || 'Caregiver unavailable.'}</p>
        <div className="mt-4 text-center"><Button as={Link} to="/find-caregivers">Browse caregivers</Button></div>
      </CardBody></Card>
    );
  }

  const c = caregiver;

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Caregiver summary */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center gap-4">
            <Avatar name={c.name} src={c.profilePhotoUrl || undefined} size="lg" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-ink">Book {c.name}</h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-ink-muted">
                {c.totalReviews > 0 && <StarRating value={c.avgRating} size={14} showValue />}
                {c.city && <span className="flex items-center gap-1"><MapPin size={13} /> {c.city}</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-muted">Rate</p>
              <p className="text-lg font-bold text-ink">{formatNpr(c.hourlyRatePaisa)}<span className="text-xs font-medium text-ink-muted">/hr</span></p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stepper */}
      <div className="mb-6 flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition ${
                i < step ? 'bg-care-500 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-surface-sunken text-ink-faint'
              }`}>
                {i < step ? <Check size={16} /> : i + 1}
              </span>
              <span className={`mt-1.5 hidden text-xs font-medium sm:block ${i <= step ? 'text-ink' : 'text-ink-faint'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`mx-2 h-0.5 flex-1 rounded ${i < step ? 'bg-care-500' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <Card>
        <CardBody>
          {/* Step 1: service & place */}
          {step === 0 && (
            <div className="space-y-5">
              {c.services?.length > 0 && (
                <div>
                  <Label>Service <span className="font-normal text-ink-faint">(optional)</span></Label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => set('service_id', '')} className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${!form.service_id ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-soft'}`}>
                      General care
                    </button>
                    {c.services.map((s) => (
                      <button key={s.id} type="button" onClick={() => set('service_id', String(s.id))} className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${form.service_id === String(s.id) ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-soft hover:border-slate-300'}`}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Care location</Label>
                <div className="grid grid-cols-2 gap-3">
                  {c.servesHome && (
                    <button type="button" onClick={() => set('location_type', 'home')} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${form.location_type === 'home' ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20' : 'border-slate-200 hover:border-slate-300'}`}>
                      <Home size={22} className={form.location_type === 'home' ? 'text-brand-600' : 'text-ink-muted'} />
                      <div><p className="text-sm font-semibold text-ink">Home visit</p><p className="text-xs text-ink-muted">Care at your home</p></div>
                    </button>
                  )}
                  {c.servesHospital && (
                    <button type="button" onClick={() => set('location_type', 'hospital')} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${form.location_type === 'hospital' ? 'border-care-500 bg-care-50 ring-2 ring-care-500/20' : 'border-slate-200 hover:border-slate-300'}`}>
                      <Building2 size={22} className={form.location_type === 'hospital' ? 'text-care-600' : 'text-ink-muted'} />
                      <div><p className="text-sm font-semibold text-ink">Hospital</p><p className="text-xs text-ink-muted">Bedside support</p></div>
                    </button>
                  )}
                </div>
              </div>

              {form.location_type === 'hospital' && (
                <Input id="hospital" label="Hospital name" value={form.hospital_name} onChange={(e) => set('hospital_name', e.target.value)} placeholder="e.g. Bir Hospital" />
              )}
              <Input
                id="address"
                label={form.location_type === 'hospital' ? 'Ward / room & address' : 'Full address'}
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder={form.location_type === 'hospital' ? 'Ward 5, Bed 12, Kathmandu' : 'Street, area, city'}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-soft">Pin your exact location <span className="font-normal text-ink-faint">(recommended)</span></label>
                {latitude ? (
                  <div className="flex items-center gap-2 rounded-xl border border-care-200 bg-care-50 px-4 py-3 text-sm font-medium text-care-700">
                    <Navigation size={15} />
                    Location shared &#10003;
                    <button type="button" onClick={() => { setLatitude(null); setLongitude(null); setGeoError(''); }} className="ml-auto text-xs font-semibold text-care-500 hover:text-care-700">Remove</button>
                  </div>
                ) : (
                  <div>
                    <button type="button" onClick={pinLocation} disabled={geoLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-ink-soft transition hover:border-brand-400 hover:text-brand-600 disabled:opacity-50">
                      {geoLoading ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
                      {geoLoading ? 'Getting your location...' : 'Use my current location'}
                    </button>
                    {geoError && <p className="mt-1.5 text-xs text-red-600">{geoError}</p>}
                    <p className="mt-1 text-xs text-ink-faint">Your caregiver will use this to verify their arrival at the visit location.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: date & time */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input id="start" type="datetime-local" label="Start" value={form.start} onChange={(e) => set('start', e.target.value)} min={toLocalInput(new Date())} />
                <Input id="end" type="datetime-local" label="End" value={form.end} onChange={(e) => set('end', e.target.value)} min={form.start} />
              </div>
              {hours > 0 && (
                <div className="flex items-center justify-between rounded-2xl bg-brand-50 px-5 py-4">
                  <div className="flex items-center gap-2 text-brand-700"><CalendarClock size={18} /><span className="text-sm font-medium">Duration: {formatHours(hours)}</span></div>
                  <div className="text-right">
                    <p className="text-xs text-brand-700/70">Estimated total</p>
                    <p className="text-xl font-bold text-brand-800">{formatNpr(estimatedTotal)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: review */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100">
                <div className="flex items-start gap-3">
                  <ClipboardCheck size={20} className="mt-0.5 shrink-0 text-brand-600" />
                  <div>
                    <p className="font-semibold text-ink">Review your booking</p>
                    <p className="mt-1 text-sm text-ink-muted">Please confirm the details below before submitting your request.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-surface-muted p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink"><ClipboardCheck size={18} className="text-brand-600" /> Booking summary</h3>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <Row label="Caregiver" value={c.name} />
                  <Row label="Service" value={c.services?.find((s) => String(s.id) === form.service_id)?.name || 'General care'} />
                  <Row label="Location" value={form.location_type === 'hospital' ? `Hospital — ${form.hospital_name}` : 'Home visit'} />
                  <Row label="Address" value={form.address} />
                  {latitude && <Row label="Location pinned" value={`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`} />}
                  <Row label="Start" value={new Date(form.start).toLocaleString()} />
                  <Row label="End" value={new Date(form.end).toLocaleString()} />
                  <Row label="Duration" value={formatHours(hours)} />
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <dt className="font-semibold text-ink">Estimated total</dt>
                    <dd className="text-lg font-bold text-brand-700">{formatNpr(estimatedTotal)}</dd>
                  </div>
                </dl>
              </div>
              <Textarea id="note" label="Note for the caregiver (optional)" rows={3} value={form.patient_note} onChange={(e) => set('patient_note', e.target.value)} placeholder="Anything the caregiver should know — mobility needs, medication times, etc." />
              <p className="text-xs text-ink-muted">You'll be able to pay after the caregiver accepts your request. The final amount is confirmed by SmartCare.</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Nav buttons */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0} icon={ArrowLeft}>Back</Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} icon={ArrowRight}>Continue</Button>
        ) : (
          <Button onClick={submit} loading={submitting} icon={submitting ? undefined : Check}>Confirm booking</Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
