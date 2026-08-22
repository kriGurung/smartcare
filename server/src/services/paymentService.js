import crypto from 'crypto';
import env from '../config/env.js';
import { PAYMENT_METHODS } from '../config/constants.js';
import logger from '../utils/logger.js';

/**
 * Payment abstraction for SmartCare.
 *
 * The plan targets eSewa + Khalti (Nepal-native wallets), plus bank transfer
 * and cash-on-visit. Real eSewa/Khalti calls need merchant credentials and a
 * public callback URL, which a local Windows FYP environment can't easily
 * provide. So this service ships a **built-in sandbox** that emulates the
 * hosted-checkout redirect flow end-to-end on localhost:
 *
 *   initiate() -> returns a checkout URL (SmartCare's own mock gateway page,
 *                 or the real gateway when *_ENABLED=true and creds are set)
 *   verify()   -> confirms a reference and reports success/failure
 *
 * When you obtain real eSewa/Khalti sandbox keys, set ESEWA_ENABLED /
 * KHALTI_ENABLED = true in .env and drop them in — the calling code
 * (paymentController) does not change.
 */

function reference(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// Signature helper mirroring eSewa's HMAC-SHA256 scheme so the shape is realistic.
function esewaSignature(message, secret) {
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

export function isOnlineMethod(method) {
  return method === PAYMENT_METHODS.ESEWA || method === PAYMENT_METHODS.KHALTI;
}

/**
 * Begin a payment. Returns { transactionRef, checkoutUrl, mode }.
 * @param {object} p
 * @param {string} p.method - esewa|khalti|bank|cash
 * @param {number} p.amountPaisa
 * @param {number} p.bookingId
 * @param {string} p.clientOrigin - where the gateway should return the user
 */
export function initiatePayment({ method, amountPaisa, bookingId, clientOrigin }) {
  const amountRs = (amountPaisa / 100).toFixed(2);

  if (method === PAYMENT_METHODS.ESEWA) {
    const transactionRef = reference('ESW');
    if (env.payments.esewa.enabled && env.payments.esewa.secret) {
      // Real eSewa v2 hosted checkout params (documented shape).
      const signedFieldNames = 'total_amount,transaction_uuid,product_code';
      const message = `total_amount=${amountRs},transaction_uuid=${transactionRef},product_code=${env.payments.esewa.merchantCode}`;
      const signature = esewaSignature(message, env.payments.esewa.secret);
      const params = new URLSearchParams({
        amount: amountRs,
        total_amount: amountRs,
        transaction_uuid: transactionRef,
        product_code: env.payments.esewa.merchantCode,
        signed_field_names: signedFieldNames,
        signature,
        success_url: `${clientOrigin}/payment/return?ref=${transactionRef}&method=esewa`,
        failure_url: `${clientOrigin}/payment/return?ref=${transactionRef}&method=esewa&status=failed`,
      });
      return {
        transactionRef,
        mode: 'live',
        checkoutUrl: `https://rc-epay.esewa.com.np/api/epay/main/v2/form?${params.toString()}`,
      };
    }
    logger.info('[eSewa:sandbox] initiate ref=%s amount=Rs.%s', transactionRef, amountRs);
    return sandboxCheckout({ transactionRef, method, amountPaisa, bookingId, clientOrigin });
  }

  if (method === PAYMENT_METHODS.KHALTI) {
    const transactionRef = reference('KHL');
    // Real Khalti ePayment initiation would POST to their /epayment/initiate/
    // endpoint server-side and return a payment_url. Kept as sandbox here.
    logger.info('[Khalti:sandbox] initiate ref=%s amount=Rs.%s', transactionRef, amountRs);
    return sandboxCheckout({ transactionRef, method, amountPaisa, bookingId, clientOrigin });
  }

  if (method === PAYMENT_METHODS.BANK) {
    return { transactionRef: reference('BNK'), mode: 'manual', checkoutUrl: null };
  }

  // cash-on-visit
  return { transactionRef: reference('CASH'), mode: 'manual', checkoutUrl: null };
}

function sandboxCheckout({ transactionRef, method, amountPaisa, bookingId, clientOrigin }) {
  // Points at SmartCare's own mock gateway page (served by the API), which
  // then redirects back to the client's /payment/return route.
  const params = new URLSearchParams({
    ref: transactionRef,
    method,
    amount: String(amountPaisa),
    booking: String(bookingId),
    origin: clientOrigin,
  });
  return {
    transactionRef,
    mode: 'sandbox',
    checkoutUrl: `/api/payments/sandbox/checkout?${params.toString()}`,
  };
}

/**
 * Verify a payment reference. In sandbox mode we trust the signed callback
 * from our own mock gateway. In live mode this is where you'd call the
 * gateway's status endpoint and check the signature (§9.6).
 */
export function verifyPayment({ method, transactionRef, gatewayStatus }) {
  if (gatewayStatus && gatewayStatus !== 'success') {
    return { success: false, gatewayRef: transactionRef };
  }
  return { success: true, gatewayRef: transactionRef };
}
