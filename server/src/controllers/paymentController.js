import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import { initiatePayment, verifyPayment, isOnlineMethod } from '../services/paymentService.js';
import { recordAudit } from '../services/auditService.js';
import { notify } from '../services/notificationService.js';
import { formatNpr } from '../utils/money.js';
import env from '../config/env.js';
import {
  ROLES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  BOOKING_STATUS,
  NOTIFICATION_TYPES,
} from '../config/constants.js';
import { Booking, Payment, User } from '../models/index.js';

// POST /api/payments/initiate  (patient)
export const initiate = asyncHandler(async (req, res) => {
  const { booking_id, method, idempotency_key } = req.body;
  if (!Object.values(PAYMENT_METHODS).includes(method)) {
    throw ApiError.badRequest(`method must be one of: ${Object.values(PAYMENT_METHODS).join(', ')}`);
  }

  const booking = await Booking.findByPk(booking_id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.patient_id !== req.user.id) throw ApiError.forbidden('You can only pay for your own bookings');
  if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.DECLINED].includes(booking.status)) {
    throw ApiError.badRequest('This booking is no longer active');
  }

  // Idempotency — reuse an existing paid/pending payment for the same key (§9.6).
  if (idempotency_key) {
    const existing = await Payment.findOne({ where: { idempotency_key } });
    if (existing) return res.json({ payment: shapePayment(existing), reused: true });
  }

  const alreadyPaid = await Payment.findOne({ where: { booking_id, status: PAYMENT_STATUS.PAID } });
  if (alreadyPaid) throw ApiError.conflict('This booking is already paid');

  const payment = await Payment.create({
    booking_id,
    amount_paisa: booking.total_amount_paisa,
    method,
    status: PAYMENT_STATUS.PENDING,
    idempotency_key: idempotency_key || null,
  });

  const init = initiatePayment({
    method,
    amountPaisa: booking.total_amount_paisa,
    bookingId: booking.id,
    clientOrigin: env.clientOrigin,
  });
  payment.transaction_ref = init.transactionRef;
  await payment.save();

  await recordAudit({ userId: req.user.id, action: 'payment_initiate', resource: `payment:${payment.id}`, meta: { method }, ip: req.ip });

  // Cash / bank are settled manually; no online redirect.
  if (!isOnlineMethod(method)) {
    return res.json({
      payment: shapePayment(payment),
      mode: 'manual',
      instructions:
        method === PAYMENT_METHODS.CASH
          ? 'Pay the caregiver in cash at the time of the visit. Reference: ' + init.transactionRef
          : 'Transfer to SmartCare Bank a/c 0123-4567-8901 (Nabil Bank) and quote reference ' + init.transactionRef,
    });
  }

  res.json({ payment: shapePayment(payment), mode: init.mode, checkoutUrl: init.checkoutUrl });
});

// GET /api/payments/sandbox/checkout  — mock hosted-gateway page (public)
export const sandboxCheckout = asyncHandler(async (req, res) => {
  const { ref, method, amount, origin } = req.query;
  const rs = formatNpr(Number(amount || 0));
  const brand = method === 'khalti' ? { name: 'Khalti', color: '#5C2D91' } : { name: 'eSewa', color: '#60BB46' };
  const back = origin || env.clientOrigin;

  // A deliberately simple page that emulates the gateway's success/failure choice.
  res.set('Content-Type', 'text/html; charset=utf-8').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${brand.name} Sandbox — SmartCare</title>
<style>
  body{font-family:system-ui,Segoe UI,sans-serif;background:#f1f5f9;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
  .card{background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.08);padding:32px;max-width:380px;width:90%;text-align:center}
  .logo{font-weight:800;font-size:26px;color:${brand.color};margin-bottom:4px}
  .badge{display:inline-block;font-size:12px;color:#64748b;background:#f1f5f9;padding:4px 10px;border-radius:999px;margin-bottom:18px}
  .amt{font-size:32px;font-weight:800;color:#0f172a;margin:10px 0}
  .ref{color:#64748b;font-size:13px;margin-bottom:22px;word-break:break-all}
  button{width:100%;padding:14px;border:0;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;margin-top:10px}
  .pay{background:${brand.color};color:#fff}
  .cancel{background:#fff;color:#ef4444;border:1px solid #fee2e2}
</style></head>
<body>
  <div class="card">
    <div class="logo">${brand.name}</div>
    <div class="badge">Sandbox · test environment</div>
    <div>Paying <strong>SmartCare</strong></div>
    <div class="amt">${rs}</div>
    <div class="ref">Ref: ${ref}</div>
    <button class="pay" onclick="go('success')">Pay ${rs}</button>
    <button class="cancel" onclick="go('failed')">Cancel payment</button>
  </div>
  <script>
    function go(status){
      var url = ${JSON.stringify(back)} + '/payment/return?ref=' + encodeURIComponent(${JSON.stringify(ref)})
        + '&method=' + encodeURIComponent(${JSON.stringify(method)}) + '&status=' + status;
      window.location.href = url;
    }
  </script>
</body></html>`);
});

// POST /api/payments/verify  — finalize a payment (called by client return page)
// Doubles as the signature-verified callback in a real deployment (§9.6).
export const verify = asyncHandler(async (req, res) => {
  const { transaction_ref, method, status } = req.body;
  const payment = await Payment.findOne({ where: { transaction_ref } });
  if (!payment) throw ApiError.notFound('Payment not found');

  const booking = await Booking.findByPk(payment.booking_id, {
    include: [{ model: User, as: 'caregiver' }, { model: User, as: 'patient' }],
  });
  if (booking && booking.patient_id !== req.user.id && req.user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden();
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    return res.json({ payment: shapePayment(payment), alreadyPaid: true });
  }

  const result = verifyPayment({ method: method || payment.method, transactionRef: transaction_ref, gatewayStatus: status });

  if (!result.success) {
    payment.status = PAYMENT_STATUS.FAILED;
    await payment.save();
    await recordAudit({ userId: req.user.id, action: 'payment_failed', resource: `payment:${payment.id}`, ip: req.ip });
    return res.status(400).json({ payment: shapePayment(payment), message: 'Payment was not completed' });
  }

  payment.status = PAYMENT_STATUS.PAID;
  payment.gateway_ref = result.gatewayRef;
  payment.paid_at = new Date();
  await payment.save();

  await recordAudit({ userId: req.user.id, action: 'payment_paid', resource: `payment:${payment.id}`, meta: { method: payment.method }, ip: req.ip });

  if (booking) {
    await notify({
      userId: booking.caregiver_id,
      type: NOTIFICATION_TYPES.PAYMENT,
      title: 'Payment received',
      message: `Payment of ${formatNpr(payment.amount_paisa)} received for a booking.`,
      link: '/caregiver/earnings',
    });
    await notify({
      userId: booking.patient_id,
      type: NOTIFICATION_TYPES.PAYMENT,
      title: 'Payment successful',
      message: `Your payment of ${formatNpr(payment.amount_paisa)} was successful.`,
      link: '/patient/payments',
      email: booking.patient?.email,
    });
  }

  res.json({ payment: shapePayment(payment) });
});

// GET /api/payments  — own history (admin sees all)
export const listPayments = asyncHandler(async (req, res) => {
  let where = {};
  let include = [{ model: Booking, as: 'booking', include: [
    { model: User, as: 'patient', attributes: ['id', 'name'] },
    { model: User, as: 'caregiver', attributes: ['id', 'name'] },
  ] }];

  const payments = await Payment.findAll({ where, include, order: [['created_at', 'DESC']], limit: 300 });

  // Scope in memory by ownership (avoids a complex join filter).
  const filtered = payments.filter((p) => {
    if (req.user.role === ROLES.ADMIN) return true;
    const b = p.booking;
    if (!b) return false;
    return b.patient_id === req.user.id || b.caregiver_id === req.user.id;
  });

  res.json({ payments: filtered.map(shapePayment) });
});

// POST /api/payments/:id/refund  (admin)
export const refund = asyncHandler(async (req, res) => {
  const payment = await Payment.findByPk(req.params.id);
  if (!payment) throw ApiError.notFound('Payment not found');
  if (payment.status !== PAYMENT_STATUS.PAID) throw ApiError.badRequest('Only paid payments can be refunded');
  payment.status = PAYMENT_STATUS.REFUNDED;
  payment.refunded_at = new Date();
  await payment.save();
  await recordAudit({ userId: req.user.id, action: 'payment_refund', resource: `payment:${payment.id}`, ip: req.ip });
  res.json({ payment: shapePayment(payment) });
});

function shapePayment(p) {
  return {
    id: p.id,
    bookingId: p.booking_id,
    amountPaisa: p.amount_paisa,
    method: p.method,
    status: p.status,
    transactionRef: p.transaction_ref,
    paidAt: p.paid_at,
    createdAt: p.created_at,
    booking: p.booking
      ? {
          id: p.booking.id,
          patientName: p.booking.patient?.name,
          caregiverName: p.booking.caregiver?.name,
          status: p.booking.status,
        }
      : undefined,
  };
}
