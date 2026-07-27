import { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import api from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import BookingCard from '../../components/BookingCard.jsx';
import { Select } from '../../components/ui/Field.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/bookings', { params: { status: status || undefined } })
      .then((r) => setBookings(r.data.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <PageHeader
        title="All bookings"
        subtitle="Every booking across the platform."
        icon={CalendarClock}
        actions={
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="declined">Declined</option>
          </Select>
        }
      />

      {loading ? (
        <Spinner label="Loading bookings…" />
      ) : bookings.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No bookings" message="No bookings match this filter." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bookings.map((b) => <BookingCard key={b.id} booking={b} perspective="admin" />)}
        </div>
      )}
    </div>
  );
}
