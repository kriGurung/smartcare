import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, CalendarClock, CheckCircle2, Clock, Plus, ArrowRight, HeartHandshake,
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

export default function PatientDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings').then((r) => setBookings(r.data.bookings || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter((b) => ACTIVE.includes(b.status));
  const completed = bookings.filter((b) => b.status === 'completed');
  const firstName = user.name.split(' ')[0];

  if (loading) return <Spinner label="Loading your dashboard…" />;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Manage your care bookings and find trusted caregivers."
        actions={<Button as={Link} to="/find-caregivers" icon={Plus}>Book care</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active bookings" value={upcoming.length} icon={CalendarClock} tone="brand" />
        <StatCard label="Completed visits" value={completed.length} icon={CheckCircle2} tone="care" />
        <StatCard label="Total bookings" value={bookings.length} icon={Clock} tone="slate" />
      </div>

      {bookings.length === 0 ? (
        <Card className="mt-6">
          <CardBody>
            <EmptyState
              icon={HeartHandshake}
              title="No bookings yet"
              message="Find a verified caregiver and book your first visit — for home or hospital care."
              action={<Button as={Link} to="/find-caregivers" icon={Search}>Find a caregiver</Button>}
            />
          </CardBody>
        </Card>
      ) : (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Upcoming & active</h2>
            <Link to="/patient/bookings" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:gap-2">
              View all <ArrowRight size={15} />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <Card><CardBody><p className="py-4 text-center text-sm text-ink-muted">No active bookings right now. <Link to="/find-caregivers" className="font-semibold text-brand-600">Book care →</Link></p></CardBody></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcoming.slice(0, 4).map((b) => <BookingCard key={b.id} booking={b} perspective="patient" />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
