import { describe, it, expect } from 'vitest';
import { toPaisa, toNpr, formatNpr } from '../utils/money.js';

describe('money utilities (integer paisa)', () => {
  it('converts NPR to paisa without floating-point drift', () => {
    expect(toPaisa(500)).toBe(50000);
    expect(toPaisa(0.5)).toBe(50);
    expect(toPaisa(1234.56)).toBe(123456);
  });

  it('rounds to the nearest paisa', () => {
    expect(toPaisa(1.006)).toBe(101);
    expect(toPaisa(1.004)).toBe(100);
    expect(toPaisa(500.99)).toBe(50099);
  });

  it('converts paisa back to NPR', () => {
    expect(toNpr(50000)).toBe(500);
    expect(toNpr(123456)).toBeCloseTo(1234.56);
  });

  it('formats using the Nepali-style en-IN grouping', () => {
    expect(formatNpr(50000)).toBe('Rs. 500');
    expect(formatNpr(1234567)).toBe('Rs. 12,345.67');
    expect(formatNpr(0)).toBe('Rs. 0');
  });

  it('handles zero and negative values', () => {
    expect(toPaisa(0)).toBe(0);
    expect(toNpr(0)).toBe(0);
  });
});
