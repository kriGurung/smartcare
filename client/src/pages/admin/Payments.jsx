import { useEffect, useState } from 'react';
import { Receipt, RotateCcw, TrendingUp } from 'lucide-react';
import api, { errMsg } from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { formatNpr, formatDateTime } from '../../lib/format.js';
import { PAYMENT_METHODS } from '../../lib/constants.js';

const METHOD_LABEL = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.id, m.name]));

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [confirmRefund, setConfirmRefund] = useState(null); // payment to refund

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/payments');
      setPayments(res.data.payments || []);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function refund(p) {
    setBusyId(p.id);
    setError('');
    try {
      await api.post(`/payments/${p.id}/refund`);
      setPayments((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: 'refunded' } : x)));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusyId(null);
    }
  }

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amountPaisa, 0);
  const refunded = payments.filter((p) => p.status === 'refunded').reduce((s, p) => s + p.amountPaisa, 0);

  if (loading) return <Spinner label="Loading payments…" />;

  return (
    <div>
      <PageHeader title="Payments" subtitle="All transactions across the platform." icon={Receipt} />

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total collected" value={formatNpr(totalPaid)} icon={TrendingUp} tone="care" />
        <StatCard label="Refunded" value={formatNpr(refunded)} icon={RotateCcw} tone="danger" />
        <StatCard label="Transactions" value={payments.length} icon={Receipt} tone="slate" />
      </div>

      {payments.length === 0 ? (
        <EmptyState icon={Receipt} title="No payments" message="Transactions will appear here once patients pay for bookings." />
      ) : (
        <Card>
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ink">{p.booking?.patientName || 'Patient'} <span className="font-normal text-ink-muted">→ {p.booking?.caregiverName || 'Caregiver'}</span></p>
                  <p className="text-xs text-ink-muted">{METHOD_LABEL[p.method] || p.method} · {formatDateTime(p.paidAt || p.createdAt)} · Ref {p.transactionRef || '—'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-ink">{formatNpr(p.amountPaisa)}</span>
                  <StatusBadge kind="payment" status={p.status} />
                  {p.status === 'paid' && (
                    <Button size="sm" variant="outline" icon={RotateCcw} loading={busyId === p.id} onClick={() => setConfirmRefund(p)}>Refund</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {confirmRefund && (
        <ConfirmDialog
          open
          title="Refund this payment?"
          message={
            <>
              <span className="font-bold text-ink">{formatNpr(confirmRefund.amountPaisa)}</span> will be refunded to{' '}
              <span className="font-semibold text-ink">{confirmRefund.booking?.patientName || 'the patient'}</span>.
              The payment is then marked as refunded.
            </>
          }
          confirmLabel="Yes, refund payment"
          loading={busyId === confirmRefund.id}
          onConfirm={() => {
            const p = confirmRefund;
            setConfirmRefund(null);
            refund(p);
          }}
          onClose={() => setConfirmRefund(null)}
        />
      )}
    </div>
  );
}
