import { useEffect, useState } from 'react';
import { Wallet, CheckCircle2, TrendingUp, Building2, MapPin } from 'lucide-react';
import api from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { formatNpr, formatDate } from '../../lib/format.js';

export default function Earnings() {
  const [stats, setStats] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/caregivers/me/stats').then((r) => setStats(r.data.stats)).catch(() => {}),
      api.get('/bookings', { params: { status: 'completed' } }).then((r) => setCompleted(r.data.bookings || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading earnings…" />;

  const avgPerJob = completed.length
    ? Math.round(completed.reduce((s, b) => s + (b.caregiver_earning_paisa || 0), 0) / completed.length)
    : 0;

  return (
    <div>
      <PageHeader title="Earnings" subtitle="Your completed visits and what you've earned." icon={Wallet} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total earned" value={formatNpr(stats?.totalEarningsPaisa ?? 0)} icon={Wallet} tone="care" hint="After platform fees" />
        <StatCard label="Completed visits" value={stats?.completedJobs ?? 0} icon={CheckCircle2} tone="brand" />
        <StatCard label="Avg. per visit" value={formatNpr(avgPerJob)} icon={TrendingUp} tone="slate" />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-ink">Completed visits</h2>
        {completed.length === 0 ? (
          <EmptyState icon={Wallet} title="No earnings yet" message="Your completed and paid visits will be listed here." />
        ) : (
          <Card>
            <div className="divide-y divide-slate-100">
              {completed.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-4 p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-sunken text-ink-soft">
                      {b.location_type === 'hospital' ? <Building2 size={20} /> : <MapPin size={20} />}
                    </span>
                    <div>
                      <p className="font-semibold text-ink">{b.patient?.name || 'Patient'}</p>
                      <p className="text-xs text-ink-muted">{formatDate(b.start_datetime)} · {b.service?.name || 'General care'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-care-600">{formatNpr(b.caregiver_earning_paisa)}</p>
                    <p className="text-xs text-ink-faint">of {formatNpr(b.total_amount_paisa)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
