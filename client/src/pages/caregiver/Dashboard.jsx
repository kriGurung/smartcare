import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox, CalendarCheck, CheckCircle2, Wallet, Star, ShieldAlert, ArrowRight,
  ShieldCheck, Clock3, UserRound, Settings2, FileCheck2, Sparkles,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import BookingCard from '../../components/BookingCard.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { formatNpr } from '../../lib/format.js';

function Action({ to, icon: Icon, title, text }) {
  return <Link to={to} className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"><span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-100"><Icon size={18} /></span><p className="font-semibold text-ink">{title}</p><p className="mt-1 text-xs leading-5 text-ink-muted">{text}</p></Link>;
}

export default function CaregiverDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/caregivers/me/stats').then((r) => setStats(r.data.stats)).catch(() => {}),
      api.get('/bookings', { params: { status: 'pending' } }).then((r) => setRequests(r.data.bookings || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading your dashboard…" />;
  const firstName = user?.name?.split(' ')[0] || 'there';
  const verified = stats?.verificationStatus === 'verified';

  return <div className="space-y-8">
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-care-700 via-care-600 to-brand-600 px-6 py-7 text-white shadow-lg sm:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Sparkles size={13}/> Caregiver workspace</div><h1 className="font-display text-2xl font-bold sm:text-3xl">Hello, {firstName}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/80">Manage your availability, respond to patients and keep your professional profile ready for bookings.</p></div>
        <Button as={Link} to="/caregiver/profile" icon={UserRound} className="bg-white text-care-700 hover:bg-white/90">Manage profile</Button>
      </div>
    </div>

    {!verified ? <Card className="border-amber-200 bg-amber-50"><CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><ShieldAlert size={24} className="mt-0.5 shrink-0 text-amber-500"/><div><p className="font-semibold text-ink">{stats?.verificationStatus === 'rejected' ? 'Your verification needs attention' : 'Complete your verification'}</p><p className="text-sm leading-5 text-ink-soft">You'll appear in patient searches and can accept bookings once verified. Complete your profile and submit the required documents.</p></div></div><Button as={Link} to="/caregiver/profile" icon={ArrowRight} className="shrink-0">Complete profile</Button></CardBody></Card> : <div className="flex items-center gap-2 rounded-xl bg-care-50 px-4 py-3 text-sm font-medium text-care-700"><ShieldCheck size={18}/> Your profile is verified and visible to patients.</div>}

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="New requests" value={stats?.pendingRequests ?? 0} icon={Inbox} tone="amber"/><StatCard label="Upcoming jobs" value={stats?.upcomingJobs ?? 0} icon={CalendarCheck} tone="brand"/><StatCard label="Completed" value={stats?.completedJobs ?? 0} icon={CheckCircle2} tone="care"/><StatCard label="Total earnings" value={formatNpr(stats?.totalEarningsPaisa ?? 0)} icon={Wallet} tone="slate"/></div>

    <div className="grid gap-4 sm:grid-cols-2"><Card><CardBody className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-500"><Star size={20}/></span><div><p className="text-sm text-ink-muted">Average rating</p><p className="text-xl font-bold text-ink">{Number(stats?.avgRating || 0).toFixed(1)} <span className="text-sm font-normal text-ink-muted">/ 5</span></p></div></div><Link to="/caregiver/reviews" className="text-sm font-semibold text-brand-600">{stats?.totalReviews || 0} reviews →</Link></CardBody></Card><Card><CardBody className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><Clock3 size={20}/></span><div><p className="text-sm text-ink-muted">Availability</p><p className="text-sm font-medium text-ink">Keep your schedule updated</p></div></div><Link to="/caregiver/availability" className="text-sm font-semibold text-brand-600">Manage →</Link></CardBody></Card></div>

    <section><div className="mb-4"><p className="eyebrow">Quick access</p><h2 className="mt-1 text-xl font-bold">Manage your work</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Action to="/caregiver/requests" icon={Inbox} title="Job requests" text="Review and respond to patient booking requests."/><Action to="/caregiver/availability" icon={CalendarCheck} title="Availability" text="Set the days and times when you can work."/><Action to="/caregiver/profile" icon={Settings2} title="Profile" text="Update your photo, services and professional details."/><Action to="/caregiver/reviews" icon={Star} title="Reviews" text="See feedback from patients after completed care."/></div></section>

    <section><div className="mb-4 flex items-center justify-between"><div><p className="eyebrow">Incoming work</p><h2 className="mt-1 text-xl font-bold">New job requests</h2></div><Link to="/caregiver/requests" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">View all <ArrowRight size={15}/></Link></div>{requests.length === 0 ? <Card><CardBody><div className="flex flex-col items-center gap-2 py-6 text-center"><FileCheck2 className="text-care-500" size={27}/><p className="font-semibold text-ink">No new requests right now</p><p className="text-sm text-ink-muted">New patient bookings will appear here when they are submitted.</p></div></CardBody></Card> : <div className="grid gap-4 md:grid-cols-2">{requests.slice(0,4).map((b)=><BookingCard key={b.id} booking={b} perspective="caregiver"/>)}</div>}</section>
  </div>;
}
