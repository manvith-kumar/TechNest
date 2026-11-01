const CURRENCY = import.meta.env.VITE_CURRENCY || 'INR';
const LOCALE = import.meta.env.VITE_LOCALE || 'en-IN';

const money = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 });
const moneyExact = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatMoney = (v, exact = false) => (v == null || Number.isNaN(Number(v)) ? '-' : (exact ? moneyExact : money).format(Number(v)));
export const formatCompact = (v) => new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 }).format(Number(v || 0));

/** The API returns UTC timestamps without a zone suffix; treat them as UTC. */
export function toDate(value) {
  if (!value) return null;
  const s = String(value);
  return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s}Z`);
}
export const formatDate = (v) => {
  const d = toDate(v);
  return d ? d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
};
export const formatDateTime = (v) => {
  const d = toDate(v);
  return d ? d.toLocaleString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-';
};
export const formatMonth = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(LOCALE, { month: 'short', year: '2-digit', timeZone: 'UTC' });
};
export const titleCase = (s) => (s ? s.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '');
export const toISODate = (d) => d.toISOString().slice(0, 10);
