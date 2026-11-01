export const ORDER_STATUSES = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export const STATUS_STYLES = {
  PLACED: 'bg-brand-soft text-brand-dark',
  CONFIRMED: 'bg-violet2-soft text-violet2',
  PROCESSING: 'bg-warning-soft text-amber-700',
  SHIPPED: 'bg-sky-100 text-sky-700',
  DELIVERED: 'bg-success-soft text-success',
  CANCELLED: 'bg-danger-soft text-danger',
  PENDING: 'bg-warning-soft text-amber-700',
  PAID: 'bg-success-soft text-success',
  REFUNDED: 'bg-violet2-soft text-violet2',
  FAILED: 'bg-danger-soft text-danger',
};

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

export const PAYMENT_LABELS = { COD: 'Cash on delivery', DEMO_ONLINE: 'Demo online payment' };
