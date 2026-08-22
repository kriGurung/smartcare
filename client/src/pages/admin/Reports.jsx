import { useEffect, useState } from 'react';
import {
  BarChart3, TrendingUp, Wallet, Users, CheckCircle2, Award, Star,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';
import api from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Avatar from '../../components/Avatar.jsx';
import { formatNpr } from '../../lib/format.js';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [trend, setTrend] = useState([]);
  const [topCaregivers, setTopCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/reports/summary').then((r) => setSummary(r.data.summary)).catch(() => {}),
      api.get('/admin/reports/revenue').then((r) => setRevenue(r.data.revenue || [])).catch(() => {}),
      api.get('/admin/reports/bookings-trend').then((r) => setTrend(r.data.trend || [])).catch(() => {}),
      api.get('/admin/reports/top-caregivers').then((r) => setTopCaregivers(r.data.topCaregivers || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading reports…" />;
  const s = summary || {};

  const revenueData = revenue.map((r) => ({ month: r.month.slice(5), Revenue: Math.round(r.revenuePaisa / 100) }));
  const trendData = trend.map((t) => ({ date: t.date.slice(5), Bookings: t.total, Completed: t.completed }));

  return (
    <div>
      <PageHeader title="Reports & analytics" subtitle="Revenue, bookings and platform growth." icon={BarChart3} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Gross volume" value={formatNpr(s.grossVolumePaisa ?? 0)} icon={TrendingUp} tone="brand" />
        <StatCard label="Platform revenue" value={formatNpr(s.platformRevenuePaisa ?? 0)} icon={Wallet} tone="care" />
        <StatCard label="Active users" value={(s.patients ?? 0) + (s.caregivers ?? 0)} icon={Users} tone="slate" />
        <StatCard label="Completed visits" value={s.completedBookings ?? 0} icon={CheckCircle2} tone="care" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Revenue" subtitle="Paid payment volume — last 6 months (Rs.)" icon={Wallet} />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip
                    formatter={(v) => [`Rs. ${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                  />
                  <Bar dataKey="Revenue" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Bookings trend" subtitle="Daily bookings — last 14 days" icon={TrendingUp} />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                  <Line type="monotone" dataKey="Bookings" stroke="#2563EB" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Completed" stroke="#10B981" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card><CardBody><p className="text-sm text-ink-muted">Verified caregivers</p><p className="mt-1 text-2xl font-bold text-ink">{s.verifiedCaregivers ?? 0}<span className="text-sm font-normal text-ink-muted"> / {s.caregivers ?? 0}</span></p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-ink-muted">Pending verification</p><p className="mt-1 text-2xl font-bold text-ink">{s.pendingVerification ?? 0}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-ink-muted">Active bookings</p><p className="mt-1 text-2xl font-bold text-ink">{s.activeBookings ?? 0}</p></CardBody></Card>
      </div>

      {topCaregivers.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader title="Top caregivers" subtitle="Highest-rated verified caregivers" icon={Award} />
            <CardBody>
              <div className="divide-y divide-slate-100">
                {topCaregivers.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <span className="w-6 text-center text-sm font-bold text-ink-muted">{i + 1}</span>
                    <Avatar name={c.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink truncate">{c.name}</p>
                      <p className="text-xs text-ink-muted">{c.city || '—'} · {c.completedBookings} completed</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                      <Star size={14} fill="currentColor" /> {c.avgRating.toFixed(1)}
                    </div>
                    <span className="text-sm font-medium text-ink-muted">{formatNpr(c.hourlyRatePaisa)}/hr</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
