import { describe, it, expect } from 'vitest';
import { initiatePayment, verifyPayment, isOnlineMethod } from '../services/paymentService.js';
import { PAYMENT_METHODS } from '../config/constants.js';

const amountPaisa = 50000; // Rs. 500.00
const bookingId = 42;
const origin = 'http://localhost:5173';

describe('paymentService', () => {
  it('classifies online vs manual methods', () => {
    expect(isOnlineMethod(PAYMENT_METHODS.ESEWA)).toBe(true);
    expect(isOnlineMethod(PAYMENT_METHODS.KHALTI)).toBe(true);
    expect(isOnlineMethod(PAYMENT_METHODS.BANK)).toBe(false);
    expect(isOnlineMethod(PAYMENT_METHODS.CASH)).toBe(false);
  });

  it('returns a sandbox checkout URL for eSewa when not configured for live', () => {
    const init = initiatePayment({ method: PAYMENT_METHODS.ESEWA, amountPaisa, bookingId, clientOrigin: origin });
    expect(init.mode).toBe('sandbox');
    expect(init.checkoutUrl).toContain('/api/payments/sandbox/checkout');
    expect(init.transactionRef).toMatch(/^ESW_/);
  });

  it('returns a sandbox checkout URL for Khalti', () => {
    const init = initiatePayment({ method: PAYMENT_METHODS.KHALTI, amountPaisa, bookingId, clientOrigin: origin });
    expect(init.mode).toBe('sandbox');
    expect(init.transactionRef).toMatch(/^KHL_/);
  });

  it('returns manual instructions for bank transfer (no redirect)', () => {
    const init = initiatePayment({ method: PAYMENT_METHODS.BANK, amountPaisa, bookingId, clientOrigin: origin });
    expect(init.mode).toBe('manual');
    expect(init.checkoutUrl).toBeNull();
    expect(init.transactionRef).toMatch(/^BNK_/);
  });

  it('returns manual instructions for cash-on-visit', () => {
    const init = initiatePayment({ method: PAYMENT_METHODS.CASH, amountPaisa, bookingId, clientOrigin: origin });
    expect(init.mode).toBe('manual');
    expect(init.checkoutUrl).toBeNull();
    expect(init.transactionRef).toMatch(/^CASH_/);
  });

  it('generates a unique reference per call', () => {
    const a = initiatePayment({ method: PAYMENT_METHODS.ESEWA, amountPaisa, bookingId, clientOrigin: origin });
    const b = initiatePayment({ method: PAYMENT_METHODS.ESEWA, amountPaisa, bookingId, clientOrigin: origin });
    expect(a.transactionRef).not.toBe(b.transactionRef);
  });

  it('verifyPayment reports success for a successful gateway status', () => {
    expect(verifyPayment({ method: 'esewa', transactionRef: 'ESW_1', gatewayStatus: 'success' }).success).toBe(true);
  });

  it('verifyPayment reports failure for any non-success status', () => {
    expect(verifyPayment({ method: 'esewa', transactionRef: 'ESW_1', gatewayStatus: 'failed' }).success).toBe(false);
  });

  it('verifyPayment treats a missing status as success in sandbox mode', () => {
    expect(verifyPayment({ method: 'cash', transactionRef: 'CASH_1' }).success).toBe(true);
  });
});
