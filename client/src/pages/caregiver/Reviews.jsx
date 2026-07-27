import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import api from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import StarRating from '../../components/StarRating.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { formatDate } from '../../lib/format.js';

export default function CaregiverReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reviews/mine').then((r) => setReviews(r.data.reviews || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  if (loading) return <Spinner label="Loading reviews…" />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My reviews" subtitle="Feedback from families you've cared for." icon={Star} />

      {reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" message="Once you complete visits, patient reviews will appear here." />
      ) : (
        <>
          <Card className="mb-6">
            <CardBody className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-muted">Average rating</p>
                <p className="text-3xl font-bold text-ink">{avg.toFixed(1)}</p>
                <StarRating value={avg} size={16} />
              </div>
              <span className="text-sm text-ink-muted">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
            </CardBody>
          </Card>

          <div className="space-y-4">
            {reviews.map((r) => (
              <Card key={r.id}>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.patient?.name} size="sm" />
                      <span className="font-semibold text-ink">{r.patient?.name || 'Patient'}</span>
                    </div>
                    <span className="text-xs text-ink-faint">{formatDate(r.created_at)}</span>
                  </div>
                  <div className="mt-2"><StarRating value={r.rating} size={16} /></div>
                  {r.comment && <p className="mt-2 text-sm text-ink-soft">{r.comment}</p>}
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
