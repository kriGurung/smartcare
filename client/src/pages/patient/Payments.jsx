import { useEffect, useState } from 'react';
import { CreditCard, Receipt } from 'lucide-react';
import api from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { formatNpr, formatDateTime } from '../../lib/format.js';
import { PAYMENT_METHODS } from '../../lib/constants.js';

const METHOD_LABEL = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.id, m.name]));

export default function PatientPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments').then((r) => setPayments(r.data.payments || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amountPaisa, 0);

  return (
    <div>
      <PageHeader title="Payments" subtitle="Your payment history and receipts." icon={CreditCard} />

      {loading ? (
        <Spinner label="Loading payments…" />
      ) : payments.length === 0 ? (
        <EmptyState icon={Receipt} title="No payments yet" message="Payments for your bookings will show up here once made." />
      ) : (
        <>
          <Card className="mb-6">
            <CardBody className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-muted">Total paid</span>
              <span className="text-2xl font-bold text-care-600">{formatNpr(totalPaid)}</span>
            </CardBody>
          </Card>

          <Card>
            <div className="divide-y divide-slate-100">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-sunken text-ink-soft"><Receipt size={20} /></span>
                    <div>
                      <p className="font-semibold text-ink">{p.booking?.caregiverName || 'Caregiver'}</p>
                      <p className="text-xs text-ink-muted">{METHOD_LABEL[p.method] || p.method} · {formatDateTime(p.paidAt || p.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink">{formatNpr(p.amountPaisa)}</p>
                    <StatusBadge kind="payment" status={p.status} className="mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
