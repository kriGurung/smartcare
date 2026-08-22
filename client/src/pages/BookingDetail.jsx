import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Building2, Clock, Phone, CreditCard, Check, X, Play,
  CheckCircle2, ClipboardList, Plus, Star, Info, ShieldAlert, Wallet, CalendarClock,
} from 'lucide-react';
import api, { errMsg } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Textarea, Select } from '../components/ui/Field.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StarRating from '../components/StarRating.jsx';
import BookingTimeline from '../components/BookingTimeline.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { formatNpr, formatDateTime, formatHours, formatDate } from '../lib/format.js';
import { PAYMENT_METHODS, BOOKING_STATUS_META } from '../lib/constants.js';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [careLogs, setCareLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [manualInfo, setManualInfo] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data.booking);
      setCareLogs(res.data.booking.careLogs || []);
    } catch (e) {
      setError(errMsg(e, 'Could not load this booking.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function act(action, extra = {}) {
    setBusy(true);
    setError('');
    try {
      await api.put(`/bookings/${id}/status`, { action, ...extra });
      toast(action === 'cancel' ? 'Booking cancelled successfully.' : action === 'reschedule' ? 'Booking rescheduled successfully.' : `Booking ${action}d successfully.`, 'success');
      await load();
    } catch (e) {
      setError(errMsg(e, `Could not ${action} this booking.`));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner label="Loading booking…" />;
  if (!booking) {
    return (
      <Card><CardBody><p className="text-center text-ink-muted">{error || 'Booking not found.'}</p></CardBody></Card>
    );
  }

  const b = booking;
  const role = user.role;
  const paidPayment = (b.payments || []).find((p) => p.status === 'paid');
  const isPaid = !!paidPayment;
  const other = role === 'caregiver' ? b.patient : b.caregiver;
  const otherLabel = role === 'caregiver' ? 'Patient' : 'Caregiver';

  // Action availability per role + status.
  const patientCanPay = role === 'patient' && b.status === 'confirmed' && !isPaid;
  const patientCanCancel = role === 'patient' && ['pending', 'confirmed'].includes(b.status);
  const patientCanReview = role === 'patient' && b.status === 'completed' && !b.review;
  const patientCanReschedule = role === 'patient' && ['pending', 'confirmed'].includes(b.status);
  const cgCanAccept = role === 'caregiver' && b.status === 'pending';
  const cgCanStart = role === 'caregiver' && b.status === 'confirmed';
  const cgCanComplete = role === 'caregiver' && b.status === 'in_progress';
  const cgCanLog = role === 'caregiver' && ['in_progress', 'completed'].includes(b.status);

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
        <ArrowLeft size={16} /> Back
      </button>

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      {manualInfo && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <Info size={18} className="mt-0.5 shrink-0" /> <span>{manualInfo}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Header card */}
          <Card>
            <CardBody>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar name={other?.name} size="lg" />
                  <div>
                    <p className="text-xs text-ink-muted">{otherLabel}</p>
                    <h1 className="text-xl font-bold text-ink">{other?.name || '—'}</h1>
                    {other?.phone && (b.status === 'confirmed' || b.status === 'in_progress') && (
                      <a href={`tel:${other.phone}`} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                        <Phone size={14} /> {other.phone}
                      </a>
                    )}
                  </div>
                </div>
                <StatusBadge kind="booking" status={b.status} />
              </div>

              <p className="mt-4 text-sm text-ink-muted">{BOOKING_STATUS_META[b.status]?.desc}</p>

              {b.decline_reason && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  <ShieldAlert size={18} className="mt-0.5 shrink-0" /> <span>Reason: {b.decline_reason}</span>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Booking progress timeline */}
          <Card>
            <CardHeader title="Booking progress" icon={CheckCircle2} />
            <CardBody>
              <BookingTimeline status={b.status} />
            </CardBody>
          </Card>

          {/* Visit details */}
          <Card>
            <CardHeader title="Visit details" icon={Clock} />
            <CardBody className="space-y-4">
              <Detail icon={Clock} label="Schedule" value={`${formatDateTime(b.start_datetime)} → ${formatDateTime(b.end_datetime)}`} sub={formatHours(Number(b.hours))} />
              <Detail
                icon={b.location_type === 'hospital' ? Building2 : MapPin}
                label={b.location_type === 'hospital' ? 'Hospital' : 'Home visit'}
                value={b.location_type === 'hospital' ? (b.hospital_name || '—') : b.address}
                sub={b.location_type === 'hospital' ? b.address : undefined}
              />
              {b.service && <Detail icon={ClipboardList} label="Service" value={b.service.name} />}
              {b.patient_note && <Detail icon={Info} label="Patient note" value={b.patient_note} />}
            </CardBody>
          </Card>

          {/* Care logs */}
          <Card>
            <CardHeader
              title="Care logs"
              subtitle="Handover notes from each visit"
              icon={ClipboardList}
              action={cgCanLog ? <Button size="sm" variant="subtle" icon={Plus} onClick={() => setLogOpen(true)}>Add log</Button> : null}
            />
            <CardBody>
              {careLogs.length === 0 ? (
                <p className="py-3 text-center text-sm text-ink-muted">No care logs yet.</p>
              ) : (
                <ul className="space-y-4">
                  {careLogs.map((log) => (
                    <li key={log.id} className="rounded-xl border border-slate-100 bg-surface-muted p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-ink-muted">{formatDateTime(log.logged_at)}</span>
                        {log.patient_mood && <Badge tone={log.patient_mood === 'good' ? 'success' : log.patient_mood === 'fair' ? 'warning' : 'danger'}>Mood: {log.patient_mood}</Badge>}
                      </div>
                      {log.tasks_completed && <p className="mt-2 text-sm text-ink-soft"><span className="font-semibold">Tasks:</span> {log.tasks_completed}</p>}
                      {log.observations && <p className="mt-1 text-sm text-ink-soft"><span className="font-semibold">Notes:</span> {log.observations}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Existing review */}
          {b.review && (
            <Card>
              <CardHeader title="Your review" icon={Star} />
              <CardBody>
                <StarRating value={b.review.rating} size={18} />
                {b.review.comment && <p className="mt-2 text-sm text-ink-soft">{b.review.comment}</p>}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar: pricing + actions */}
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-20">
            <CardHeader title="Payment" icon={Wallet} />
            <CardBody>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-ink-muted">Rate</dt><dd className="font-medium text-ink">{formatNpr(b.hourly_rate_paisa)}/hr</dd></div>
                <div className="flex justify-between"><dt className="text-ink-muted">Hours</dt><dd className="font-medium text-ink">{formatHours(Number(b.hours))}</dd></div>
                {role === 'caregiver' && (
                  <>
                    <div className="flex justify-between"><dt className="text-ink-muted">Platform fee</dt><dd className="font-medium text-ink">−{formatNpr(b.commission_paisa)}</dd></div>
                    <div className="flex justify-between border-t border-slate-100 pt-2"><dt className="font-semibold text-ink">You earn</dt><dd className="text-lg font-bold text-care-600">{formatNpr(b.caregiver_earning_paisa)}</dd></div>
                  </>
                )}
                {role !== 'caregiver' && (
                  <div className="flex justify-between border-t border-slate-100 pt-2"><dt className="font-semibold text-ink">Total</dt><dd className="text-lg font-bold text-ink">{formatNpr(b.total_amount_paisa)}</dd></div>
                )}
              </dl>

              <div className="mt-3">
                {isPaid ? (
                  <Badge tone="success" icon={CheckCircle2}>Paid via {paidPayment.method}</Badge>
                ) : (
                  <Badge tone="warning">Payment pending</Badge>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-5 space-y-2.5">
                {patientCanPay && <Button icon={CreditCard} className="w-full" onClick={() => setPayOpen(true)}>Pay now</Button>}
                {patientCanReview && <Button variant="care" icon={Star} className="w-full" onClick={() => setReviewOpen(true)}>Leave a review</Button>}
                {patientCanReschedule && <Button variant="outline" icon={CalendarClock} className="w-full" onClick={() => setRescheduleOpen(true)}>Reschedule</Button>}
                {cgCanAccept && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button variant="care" icon={Check} loading={busy} onClick={() => act('accept')}>Accept</Button>
                    <Button variant="outline" icon={X} loading={busy} onClick={() => setConfirmAction('decline')}>Decline</Button>
                  </div>
                )}
                {cgCanStart && <Button icon={Play} className="w-full" loading={busy} onClick={() => act('start')}>Start visit</Button>}
                {cgCanComplete && <Button variant="care" icon={CheckCircle2} className="w-full" loading={busy} onClick={() => act('complete')}>Mark complete</Button>}
                {patientCanCancel && <Button variant="ghost" icon={X} className="w-full text-danger" loading={busy} onClick={() => setConfirmAction('cancel')}>Cancel booking</Button>}
              </div>
            </CardBody>
          </Card>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-xs text-ink-muted">
            <p className="font-semibold text-ink-soft">Booking #{b.id}</p>
            <p className="mt-1">Created {formatDate(b.created_at)}</p>
          </div>
        </div>
      </div>

      {payOpen && <PaymentModal booking={b} onClose={() => setPayOpen(false)} onManual={(msg) => { setManualInfo(msg); setPayOpen(false); load(); }} />}
      {reviewOpen && <ReviewModal bookingId={b.id} onClose={() => setReviewOpen(false)} onDone={() => { setReviewOpen(false); load(); }} />}
      {logOpen && <CareLogModal bookingId={b.id} onClose={() => setLogOpen(false)} onDone={() => { setLogOpen(false); load(); }} />}
      {rescheduleOpen && <RescheduleModal booking={b} onClose={() => setRescheduleOpen(false)} onDone={(msg) => { setRescheduleOpen(false); toast(msg || 'Booking rescheduled.', 'success'); load(); }} />}

      {confirmAction && (
        <ConfirmDialog
          open
          title={confirmAction === 'cancel' ? 'Cancel this booking?' : 'Decline this request?'}
          message={
            confirmAction === 'cancel'
              ? 'The caregiver\'s schedule will be freed and no further actions can be taken on this booking. This cannot be undone.'
              : 'Declining will notify the patient so they can book another caregiver. This cannot be undone.'
          }
          confirmLabel={confirmAction === 'cancel' ? 'Yes, cancel booking' : 'Yes, decline request'}
          loading={busy}
          onConfirm={() => {
            const action = confirmAction;
            setConfirmAction(null);
            act(action, action === 'decline' ? { reason: 'Not available' } : {});
          }}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-sunken text-ink-soft"><Icon size={17} /></span>
      <div className="min-w-0">
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="font-medium text-ink">{value}</p>
        {sub && <p className="text-sm text-ink-muted">{sub}</p>}
      </div>
    </div>
  );
}

// ── Reschedule modal ─────────────────────────────────────
function RescheduleModal({ booking, onClose, onDone }) {
  const [start, setStart] = useState(() => booking.start_datetime ? new Date(booking.start_datetime).toISOString().slice(0, 16) : '');
  const [end, setEnd] = useState(() => booking.end_datetime ? new Date(booking.end_datetime).toISOString().slice(0, 16) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setLoading(true);
    setError('');
    try {
      await api.put(`/bookings/${booking.id}/status`, {
        action: 'reschedule',
        start_datetime: new Date(start).toISOString(),
        end_datetime: new Date(end).toISOString(),
      });
      onDone('Booking rescheduled successfully.');
    } catch (e) {
      setError(errMsg(e, 'Could not reschedule this booking.'));
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Reschedule booking"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon={CalendarClock} loading={loading} onClick={submit}>Confirm reschedule</Button>
        </>
      }
    >
      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">New start time</label>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="input-base w-full" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">New end time</label>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="input-base w-full" />
        </div>
        <p className="text-xs text-ink-muted">The caregiver will be notified of the new schedule. Pricing will be recalculated if the duration changes.</p>
      </div>
    </Modal>
  );
}

// ── Payment modal ────────────────────────────────────────
function PaymentModal({ booking, onClose, onManual }) {
  const [method, setMethod] = useState('esewa');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/payments/initiate', { booking_id: booking.id, method });
      const data = res.data;
      if (data.mode === 'manual') {
        onManual(data.instructions || 'Follow the payment instructions to complete your booking.');
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // to the (sandbox) gateway
        return;
      }
      onManual('Payment initiated.');
    } catch (e) {
      setError(errMsg(e, 'Could not start the payment.'));
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Choose a payment method"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon={CreditCard} loading={loading} onClick={pay}>Pay {formatNpr(booking.total_amount_paisa)}</Button>
        </>
      }
    >
      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <div className="space-y-2.5">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
              method === m.id ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/15' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl font-bold text-white" style={{ background: m.color }}>
              {m.name[0]}
            </span>
            <div className="flex-1">
              <p className="font-semibold text-ink">{m.name}</p>
              <p className="text-xs text-ink-muted">{m.blurb}</p>
            </div>
            {method === m.id && <Check size={20} className="text-brand-600" />}
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-ink-faint">eSewa &amp; Khalti open a secure sandbox checkout. This is a test environment — no real money moves.</p>
    </Modal>
  );
}

// ── Review modal ─────────────────────────────────────────
function ReviewModal({ bookingId, onClose, onDone }) {
  const [rating, setRating] = useState(5);
  const [sub, setSub] = useState({ punctuality: 5, care_quality: 5, communication: 5 });
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setLoading(true);
    setError('');
    try {
      await api.post('/reviews', { booking_id: bookingId, rating, ...sub, comment: comment.trim() || undefined });
      onDone();
    } catch (e) {
      setError(errMsg(e, 'Could not submit your review.'));
      setLoading(false);
    }
  }

  const rows = [
    ['Overall', rating, (v) => setRating(v)],
    ['Punctuality', sub.punctuality, (v) => setSub((s) => ({ ...s, punctuality: v }))],
    ['Care quality', sub.care_quality, (v) => setSub((s) => ({ ...s, care_quality: v }))],
    ['Communication', sub.communication, (v) => setSub((s) => ({ ...s, communication: v }))],
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title="Rate your caregiver"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="care" icon={Star} loading={loading} onClick={submit}>Submit review</Button>
        </>
      }
    >
      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <div className="space-y-4">
        {rows.map(([label, val, set]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-soft">{label}</span>
            <StarRating value={val} size={26} onChange={set} />
          </div>
        ))}
        <Textarea id="comment" label="Comment (optional)" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience to help other families…" />
      </div>
    </Modal>
  );
}

// ── Care log modal ───────────────────────────────────────
function CareLogModal({ bookingId, onClose, onDone }) {
  const [form, setForm] = useState({ tasks_completed: '', observations: '', patient_mood: 'good' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setLoading(true);
    setError('');
    try {
      await api.post(`/bookings/${bookingId}/care-logs`, form);
      onDone();
    } catch (e) {
      setError(errMsg(e, 'Could not save the care log.'));
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add a care log"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon={Check} loading={loading} onClick={submit}>Save log</Button>
        </>
      }
    >
      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <div className="space-y-4">
        <Textarea id="tasks" label="Tasks completed" rows={3} value={form.tasks_completed} onChange={(e) => setForm({ ...form, tasks_completed: e.target.value })} placeholder="Bathing, medication at 2pm, light exercise…" />
        <Textarea id="obs" label="Observations" rows={3} value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} placeholder="How the patient is doing, anything to note…" />
        <Select id="mood" label="Patient mood" value={form.patient_mood} onChange={(e) => setForm({ ...form, patient_mood: e.target.value })}>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </Select>
      </div>
    </Modal>
  );
}
