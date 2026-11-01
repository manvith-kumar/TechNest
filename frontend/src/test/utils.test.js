import { describe, expect, it } from 'vitest';
import { formatMoney, formatMonth, titleCase, toDate } from '../utils/format';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { isStrongPassword, EMAIL_RE } from '../utils/validation';
import { fallbackImage, resolveImage } from '../utils/images';
import { computeTotals } from '../components/cart/OrderSummary';

describe('format', () => {
  it('formats rupees without decimals by default and with decimals when exact', () => {
    expect(formatMoney(74900)).toMatch(/74,900/);
    expect(formatMoney(74900.5, true)).toMatch(/74,900\.50/);
    expect(formatMoney(null)).toBe('-');
  });
  it('treats zone-less API timestamps as UTC', () => {
    expect(toDate('2026-10-31T12:00:00').toISOString()).toBe('2026-10-31T12:00:00.000Z');
    expect(toDate('2026-10-31T12:00:00+05:30').toISOString()).toBe('2026-10-31T06:30:00.000Z');
    expect(toDate(null)).toBeNull();
  });
  it('formats months and status labels', () => {
    expect(formatMonth('2026-03')).toMatch(/Mar/);
    expect(titleCase('OUT_FOR_DELIVERY')).toBe('Out for delivery');
  });
});

describe('errors', () => {
  it('prefers the server message', () => {
    expect(getErrorMessage({ response: { status: 409, data: { message: 'Only 2 units available.' } } })).toBe('Only 2 units available.');
  });
  it('explains network failures and timeouts', () => {
    expect(getErrorMessage({})).toMatch(/Cannot reach the server/);
    expect(getErrorMessage({ code: 'ECONNABORTED' })).toMatch(/too long/);
  });
  it('hides raw 5xx details', () => {
    expect(getErrorMessage({ response: { status: 500, data: {} } })).toMatch(/server ran into a problem/);
  });
  it('exposes field errors', () => {
    expect(getFieldErrors({ response: { data: { fieldErrors: { email: 'bad' } } } })).toEqual({ email: 'bad' });
    expect(getFieldErrors(null)).toEqual({});
  });
});

describe('validation', () => {
  it('mirrors the server password rule', () => {
    expect(isStrongPassword('Passw0rdOK')).toBe(true);
    expect(isStrongPassword('password1')).toBe(false);
    expect(isStrongPassword('PASSWORD1')).toBe(false);
    expect(isStrongPassword('Short1')).toBe(false);
    expect(isStrongPassword('A1' + 'a'.repeat(80))).toBe(false);
  });
  it('validates emails', () => {
    expect(EMAIL_RE.test('a@b.co')).toBe(true);
    expect(EMAIL_RE.test('nope@')).toBe(false);
  });
});

describe('images', () => {
  it('builds an inline SVG fallback and escapes the label', () => {
    const url = fallbackImage('<script>x</script>', 3);
    expect(url.startsWith('data:image/svg+xml')).toBe(true);
    expect(decodeURIComponent(url)).not.toContain('<script>');
  });
  it('leaves remote urls untouched', () => {
    expect(resolveImage('https://x.test/a.jpg')).toBe('https://x.test/a.jpg');
  });
});

describe('checkout totals', () => {
  const cart = { freeShippingThreshold: 5000, flatShippingFee: 99 };
  const item = (unit, orig, qty) => ({ unitPrice: unit, originalPrice: orig, quantity: qty, lineTotal: unit * qty });
  it('adds flat shipping below the threshold', () => {
    const t = computeTotals([item(1000, 1200, 2)], cart);
    expect(t).toMatchObject({ subtotal: 2000, savings: 400, shipping: 99, total: 2099 });
  });
  it('is free at the threshold and for an empty selection', () => {
    expect(computeTotals([item(2500, 2500, 2)], cart).shipping).toBe(0);
    expect(computeTotals([], cart)).toMatchObject({ subtotal: 0, shipping: 0, total: 0 });
  });
});
