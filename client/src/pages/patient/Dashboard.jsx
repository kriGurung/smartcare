import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, CalendarClock, CheckCircle2, Clock3, Plus, ArrowRight, HeartHandshake,
  CreditCard, UserRound, ShieldCheck, Sparkles, MapPin, Star,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import BookingCard from '../../components/BookingCard.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const ACTIVE = ['pending', 'confirmed', 'in_progress'];

function QuickAction({ to, icon: Icon, title, text }) {
  return (
    <Link to={to} className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card">
      <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-100"><Icon size={19} /></span>
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs leading-5 text-ink-muted">{text}</p>
    </Link>
  );
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings').then((r) => setBookings(r.data.bookings || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const upcoming = useMemo(() => bookings.filter((b) => ACTIVE.includes(b.status)), [bookings]);
  const completed = useMemo(() => bookings.filter((b) => b.status === 'completed'), [bookings]);
  const firstName = user?.name?.split(' ')[0] || 'there';

  if (loading) return <Spinner label="Loading your dashboard…" />;

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles size={13} /> SmartCare patient portal
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Welcome back, {firstName}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">Find trusted caregivers, manage your visits and keep everything related to your care in one place.</p>
          </div>
          <Button as={Link} to="/find-caregivers" icon={Search} className="bg-white text-brand-700 hover:bg-white/90">Find a caregiver</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active bookings" value={upcoming.length} icon={CalendarClock} tone="brand" />
        <StatCard label="Completed visits" value={completed.length} icon={CheckCircle2} tone="care" />
        <StatCard label="Total bookings" value={bookings.length} icon={Clock3} tone="slate" />
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div><p className="eyebrow">Quick access</p><h2 className="mt-1 text-xl font-bold">What would you like to do?</h2></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction to="/find-caregivers" icon={Search} title="Find caregiver" text="Browse verified caregivers and compare profiles." />
          <QuickAction to="/patient/bookings" icon={CalendarClock} title="My bookings" text="Track upcoming, completed and cancelled visits." />
          <QuickAction to="/patient/payments" icon={CreditCard} title="Payments" text="Review your payment history and status." />
          <QuickAction to="/patient/profile" icon={UserRound} title="My profile" text="Keep your personal and care details up to date." />
        </div>
      </section>

      {bookings.length === 0 ? (
        <Card>
          <CardBody className="py-10">
            <EmptyState icon={HeartHandshake} title="Your care journey starts here" message="Find a verified caregiver for home or hospital care and make your first booking." action={<Button as={Link} to="/find-caregivers" icon={Search}>Find a caregiver</Button>} />
          </CardBody>
        </Card>
      ) : (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div><p className="eyebrow">Your care</p><h2 className="mt-1 text-xl font-bold">Upcoming & active</h2></div>
            <Link to="/patient/bookings" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:gap-2">View all <ArrowRight size={15} /></Link>
          </div>
          {upcoming.length === 0 ? (
            <Card><CardBody><div className="flex flex-col items-center gap-3 py-6 text-center"><CheckCircle2 className="text-care-500" size={28} /><p className="font-semibold text-ink">No active bookings right now</p><Link to="/find-caregivers" className="text-sm font-semibold text-brand-600">Book your next visit →</Link></div></CardBody></Card>
          ) : <div className="grid gap-4 md:grid-cols-2">{upcoming.slice(0, 4).map((b) => <BookingCard key={b.id} booking={b} perspective="patient" />)}</div>}
        </section>
      )}

      <Card className="overflow-hidden border-brand-100 bg-brand-50/60">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><ShieldCheck size={20} /></span><div><p className="font-semibold text-ink">Choose care with confidence</p><p className="mt-1 text-sm leading-5 text-ink-muted">Look for verified caregivers, review their experience and check availability before booking.</p></div></div>
          <Link to="/how-it-works" className="shrink-0 text-sm font-semibold text-brand-700">How SmartCare works →</Link>
        </CardBody>
      </Card>
    </div>
  );
}
