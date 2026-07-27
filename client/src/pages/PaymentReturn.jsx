import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import api, { errMsg } from '../services/api.js';
import Button from '../components/ui/Button.jsx';
import { LogoMark } from '../components/Logo.jsx';
import { formatNpr } from '../lib/format.js';

// The sandbox (and, in production, the real gateway) redirects the browser
// here with the transaction ref + outcome. We finalize it server-side.
export default function PaymentReturn() {
  const [params] = useSearchParams();
  const [state, setState] = useState('verifying'); // verifying | success | failed
  const [payment, setPayment] = useState(null);
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  const ref = params.get('ref');
  const method = params.get('method');
  const status = params.get('status');

  useEffect(() => {
    if (ran.current) return; // guard React StrictMode double-invoke
    ran.current = true;

    async function verify() {
      if (!ref) {
        setState('failed');
        setMessage('Missing payment reference.');
        return;
      }
      try {
        const res = await api.post('/payments/verify', { transaction_ref: ref, method, status });
        setPayment(res.data.payment);
        setState(res.data.payment?.status === 'paid' ? 'success' : 'failed');
        if (res.data.payment?.status !== 'paid') setMessage('Payment was not completed.');
      } catch (e) {
        setState('failed');
        setMessage(errMsg(e, 'We could not confirm this payment.'));
      }
    }
    verify();
  }, [ref, method, status]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="card-base w-full max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center"><LogoMark size={44} /></div>

        {state === 'verifying' && (
          <>
            <Loader2 size={48} className="mx-auto animate-spin-slow text-brand-600" />
            <h1 className="mt-5 text-xl font-bold text-ink">Confirming your payment…</h1>
            <p className="mt-1 text-sm text-ink-muted">Please wait, this only takes a moment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2 size={56} className="mx-auto text-care-500" />
            <h1 className="mt-5 text-2xl font-bold text-ink">Payment successful</h1>
            {payment && <p className="mt-1 text-lg font-semibold text-care-600">{formatNpr(payment.amountPaisa)}</p>}
            <p className="mt-2 text-sm text-ink-muted">Your booking is confirmed and the caregiver has been notified.</p>
            <div className="mt-7 flex flex-col gap-3">
              <Button as={Link} to="/patient/bookings" icon={ArrowRight}>View my bookings</Button>
              <Button as={Link} to="/patient/payments" variant="outline">Payment history</Button>
            </div>
          </>
        )}

        {state === 'failed' && (
          <>
            <XCircle size={56} className="mx-auto text-danger" />
            <h1 className="mt-5 text-2xl font-bold text-ink">Payment not completed</h1>
            <p className="mt-2 text-sm text-ink-muted">{message || 'The payment was cancelled or failed. You can try again from your bookings.'}</p>
            <div className="mt-7 flex flex-col gap-3">
              <Button as={Link} to="/patient/bookings">Back to bookings</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
