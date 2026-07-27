import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox, CalendarCheck, CheckCircle2, Wallet, Star, ShieldAlert, ArrowRight,
  ShieldCheck, Clock,
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

  const firstName = user.name.split(' ')[0];
  const verified = stats?.verificationStatus === 'verified';

  if (loading) return <Spinner label="Loading your dashboard…" />;

  return (
    <div>
      <PageHeader title={`Hello, ${firstName}`} subtitle="Here's your caregiving activity at a glance." />

      {/* Verification nudge */}
      {!verified && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert size={24} className="mt-0.5 shrink-0 text-amber-500" />
              <div>
                <p className="font-semibold text-ink">
                  {stats?.verificationStatus === 'rejected' ? 'Your verification needs attention' : 'Complete your verification'}
                </p>
                <p className="text-sm text-ink-soft">
                  You'll appear in patient searches and can accept bookings once verified. Add your profile details and upload your documents.
                </p>
              </div>
            </div>
            <Button as={Link} to="/caregiver/profile" icon={ArrowRight} className="shrink-0">Complete profile</Button>
          </CardBody>
        </Card>
      )}

      {verified && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-care-50 px-4 py-3 text-sm font-medium text-care-700">
          <ShieldCheck size={18} /> Your profile is verified and visible to patients.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New requests" value={stats?.pendingRequests ?? 0} icon={Inbox} tone="amber" />
        <StatCard label="Upcoming jobs" value={stats?.upcomingJobs ?? 0} icon={CalendarCheck} tone="brand" />
        <StatCard label="Completed" value={stats?.completedJobs ?? 0} icon={CheckCircle2} tone="care" />
        <StatCard label="Total earnings" value={formatNpr(stats?.totalEarningsPaisa ?? 0)} icon={Wallet} tone="slate" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-500"><Star size={20} /></span>
              <div>
                <p className="text-sm text-ink-muted">Average rating</p>
                <p className="text-xl font-bold text-ink">{Number(stats?.avgRating || 0).toFixed(1)} <span className="text-sm font-normal text-ink-muted">/ 5</span></p>
              </div>
            </div>
            <Link to="/caregiver/reviews" className="text-sm font-semibold text-brand-600">{stats?.totalReviews || 0} reviews →</Link>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><Clock size={20} /></span>
              <div>
                <p className="text-sm text-ink-muted">Set your availability</p>
                <p className="text-sm font-medium text-ink">Let patients know when you're free</p>
              </div>
            </div>
            <Link to="/caregiver/availability" className="text-sm font-semibold text-brand-600">Manage →</Link>
          </CardBody>
        </Card>
      </div>

      {/* Incoming requests */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">New job requests</h2>
          <Link to="/caregiver/requests" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:gap-2">
            View all <ArrowRight size={15} />
          </Link>
        </div>
        {requests.length === 0 ? (
          <Card><CardBody><p className="py-4 text-center text-sm text-ink-muted">No new requests right now. They'll appear here when patients book you.</p></CardBody></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {requests.slice(0, 4).map((b) => <BookingCard key={b.id} booking={b} perspective="caregiver" />)}
          </div>
        )}
      </section>
    </div>
  );
}
