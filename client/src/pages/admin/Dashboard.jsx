import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, ShieldCheck, ShieldAlert, CalendarClock, CheckCircle2, TrendingUp,
  Wallet, ArrowRight, Activity, UserCheck, ClipboardList, Settings2,
} from 'lucide-react';
import api from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { formatNpr } from '../../lib/format.js';

function AdminAction({ to, icon: Icon, title, text }) {
  return <Link to={to} className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"><span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-100"><Icon size={18}/></span><p className="font-semibold text-ink">{title}</p><p className="mt-1 text-xs leading-5 text-ink-muted">{text}</p></Link>;
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/reports/summary').then((r) => setSummary(r.data.summary)).catch(() => {}),
      api.get('/admin/caregivers/pending').then((r) => setPending(r.data.caregivers || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading admin dashboard…" />;
  const s = summary || {};

  return <div className="space-y-8">
    <PageHeader title="Admin dashboard" subtitle="Monitor SmartCare activity, verification and platform performance." icon={Activity}/>

    {s.pendingVerification > 0 && <Card className="border-amber-200 bg-amber-50"><CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><ShieldAlert size={24} className="text-amber-500"/><div><p className="font-semibold text-ink">Verification queue needs attention</p><p className="text-sm text-ink-soft"><span className="font-bold">{s.pendingVerification}</span> caregiver{s.pendingVerification !== 1 ? 's' : ''} are waiting for review.</p></div></div><Button as={Link} to="/admin/verify" icon={ArrowRight}>Review now</Button></CardBody></Card>}

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Patients" value={s.patients ?? 0} icon={Users} tone="brand"/><StatCard label="Caregivers" value={s.caregivers ?? 0} icon={UserCheck} tone="care" hint={`${s.verifiedCaregivers ?? 0} verified`}/><StatCard label="Total bookings" value={s.totalBookings ?? 0} icon={CalendarClock} tone="slate" hint={`${s.activeBookings ?? 0} active`}/><StatCard label="Completed" value={s.completedBookings ?? 0} icon={CheckCircle2} tone="care"/></div>

    <div className="grid gap-4 sm:grid-cols-2"><StatCard label="Gross volume" value={formatNpr(s.grossVolumePaisa ?? 0)} icon={TrendingUp} tone="brand" hint="All paid payments"/><StatCard label="Platform revenue" value={formatNpr(s.platformRevenuePaisa ?? 0)} icon={Wallet} tone="care" hint="Commission earned"/></div>

    <section><div className="mb-4"><p className="eyebrow">Administration</p><h2 className="mt-1 text-xl font-bold">Quick management</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><AdminAction to="/admin/verify" icon={ShieldCheck} title="Verify caregivers" text="Review caregiver profiles and submitted documents."/><AdminAction to="/admin/users" icon={Users} title="Manage users" text="View patients and caregiver accounts."/><AdminAction to="/admin/bookings" icon={ClipboardList} title="Manage bookings" text="Monitor booking activity and statuses."/><AdminAction to="/admin/reports" icon={TrendingUp} title="Reports & analytics" text="Review platform activity and financial reports."/></div></section>

    <section><div className="mb-4 flex items-center justify-between"><div><p className="eyebrow">Pending actions</p><h2 className="mt-1 text-xl font-bold">Caregiver verification queue</h2></div><Link to="/admin/verify" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">View all <ArrowRight size={15}/></Link></div>{pending.length === 0 ? <Card><CardBody><div className="flex items-center gap-2 py-4 text-sm text-ink-muted"><ShieldCheck size={18} className="text-care-500"/> No caregivers waiting for verification.</div></CardBody></Card> : <Card><div className="divide-y divide-slate-100">{pending.slice(0,6).map((c)=><Link key={c.id} to="/admin/verify" className="flex items-center justify-between gap-4 p-4 transition hover:bg-surface-sunken"><div className="min-w-0"><p className="truncate font-semibold text-ink">{c.name}</p><p className="text-xs text-ink-muted">{c.city || 'No city'} · {c.documents?.length || 0} document{c.documents?.length !== 1 ? 's' : ''}</p></div><Badge tone="warning">Pending</Badge></Link>)}</div></Card>}</section>

    <Card className="border-brand-100 bg-brand-50/60"><CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><Settings2 size={19}/></span><div><p className="font-semibold text-ink">Keep platform settings consistent</p><p className="text-sm text-ink-muted">Review service configuration and system settings when operational requirements change.</p></div></div><Link to="/admin/settings" className="text-sm font-semibold text-brand-700">Open settings →</Link></CardBody></Card>
  </div>;
}
