import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Search, Plus } from 'lucide-react';
import api from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import BookingCard from '../../components/BookingCard.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const TABS = [
  { id: 'active', label: 'Active', match: ['pending', 'confirmed', 'in_progress'] },
  { id: 'completed', label: 'Completed', match: ['completed'] },
  { id: 'cancelled', label: 'Cancelled', match: ['cancelled', 'declined'] },
  { id: 'all', label: 'All', match: null },
];

export default function PatientBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    api.get('/bookings').then((r) => setBookings(r.data.bookings || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const active = TABS.find((t) => t.id === tab);
  const filtered = active.match ? bookings.filter((b) => active.match.includes(b.status)) : bookings;

  return (
    <div>
      <PageHeader
        title="My bookings"
        subtitle="Track your care visits and their status."
        icon={CalendarClock}
        actions={<Button as={Link} to="/find-caregivers" icon={Plus}>New booking</Button>}
      />

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-surface-sunken p-1 scroll-none">
        {TABS.map((t) => {
          const count = t.match ? bookings.filter((b) => t.match.includes(b.status)).length : bookings.length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === t.id ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t.label} <span className="text-ink-faint">({count})</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <Spinner label="Loading bookings…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={`No ${tab === 'all' ? '' : tab} bookings`}
          message="When you book a caregiver, your visits will appear here."
          action={<Button as={Link} to="/find-caregivers" icon={Search}>Find a caregiver</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((b) => <BookingCard key={b.id} booking={b} perspective="patient" />)}
        </div>
      )}
    </div>
  );
}
