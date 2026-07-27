import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, ShieldCheck, ShieldAlert, CalendarClock, CheckCircle2, TrendingUp,
  Wallet, ArrowRight, Activity,
} from 'lucide-react';
import api from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { formatNpr } from '../../lib/format.js';

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

  return (
    <div>
      <PageHeader title="Admin dashboard" subtitle="Platform overview and pending actions." icon={Activity} />

      {s.pendingVerification > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardBody className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert size={24} className="text-amber-500" />
              <p className="font-medium text-ink">
                <span className="font-bold">{s.pendingVerification}</span> caregiver{s.pendingVerification !== 1 ? 's' : ''} awaiting verification.
              </p>
            </div>
            <Button as={Link} to="/admin/verify" icon={ArrowRight} className="shrink-0">Review now</Button>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Patients" value={s.patients ?? 0} icon={Users} tone="brand" />
        <StatCard label="Caregivers" value={s.caregivers ?? 0} icon={Users} tone="care" hint={`${s.verifiedCaregivers ?? 0} verified`} />
        <StatCard label="Total bookings" value={s.totalBookings ?? 0} icon={CalendarClock} tone="slate" hint={`${s.activeBookings ?? 0} active`} />
        <StatCard label="Completed" value={s.completedBookings ?? 0} icon={CheckCircle2} tone="care" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard label="Gross volume" value={formatNpr(s.grossVolumePaisa ?? 0)} icon={TrendingUp} tone="brand" hint="All paid payments" />
        <StatCard label="Platform revenue" value={formatNpr(s.platformRevenuePaisa ?? 0)} icon={Wallet} tone="care" hint="Commission earned" />
      </div>

      {/* Pending verification queue */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Verification queue</h2>
          <Link to="/admin/verify" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:gap-2">View all <ArrowRight size={15} /></Link>
        </div>
        {pending.length === 0 ? (
          <Card><CardBody><div className="flex items-center gap-2 py-3 text-sm text-ink-muted"><ShieldCheck size={18} className="text-care-500" /> No caregivers waiting for verification.</div></CardBody></Card>
        ) : (
          <Card>
            <div className="divide-y divide-slate-100">
              {pending.slice(0, 5).map((c) => (
                <Link key={c.id} to="/admin/verify" className="flex items-center justify-between p-4 transition hover:bg-surface-sunken">
                  <div>
                    <p className="font-semibold text-ink">{c.name}</p>
                    <p className="text-xs text-ink-muted">{c.city || 'No city'} · {c.documents?.length || 0} document{c.documents?.length !== 1 ? 's' : ''}</p>
                  </div>
                  <Badge tone="warning">Pending</Badge>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
