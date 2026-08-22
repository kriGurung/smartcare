import { useEffect, useState } from 'react';
import { Inbox } from 'lucide-react';
import api from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import BookingCard from '../../components/BookingCard.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';

const TABS = [
  { id: 'pending', label: 'New requests', match: ['pending'] },
  { id: 'active', label: 'Active', match: ['confirmed', 'in_progress'] },
  { id: 'completed', label: 'Completed', match: ['completed'] },
  { id: 'all', label: 'All', match: null },
];

export default function JobRequests() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');

  useEffect(() => {
    api.get('/bookings').then((r) => setBookings(r.data.bookings || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const active = TABS.find((t) => t.id === tab);
  const filtered = active.match ? bookings.filter((b) => active.match.includes(b.status)) : bookings;

  return (
    <div>
      <PageHeader title="Job requests" subtitle="Accept requests and manage your visits." icon={Inbox} />

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-surface-sunken p-1 scroll-none">
        {TABS.map((t) => {
          const count = t.match ? bookings.filter((b) => t.match.includes(b.status)).length : bookings.length;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === t.id ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-muted hover:text-ink'}`}>
              {t.label} <span className="text-ink-faint">({count})</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <Spinner label="Loading requests…" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="Nothing here yet" message="New booking requests from patients will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((b) => <BookingCard key={b.id} booking={b} perspective="caregiver" />)}
        </div>
      )}
    </div>
  );
}
