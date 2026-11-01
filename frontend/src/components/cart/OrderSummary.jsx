import { Truck } from 'lucide-react';
import { formatMoney } from '../../utils/format';

/** Totals shown to the customer. The server recomputes everything again when the order is placed. */
export function computeTotals(items, cart) {
  const subtotal = items.reduce((s, i) => s + Number(i.lineTotal), 0);
  const savings = items.reduce((s, i) => s + (Number(i.originalPrice) - Number(i.unitPrice)) * i.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= Number(cart.freeShippingThreshold) ? 0 : Number(cart.flatShippingFee);
  return { subtotal, savings, shipping, total: subtotal + shipping };
}

export default function OrderSummary({ totals, threshold, children }) {
  const remaining = Number(threshold) - totals.subtotal;
  return (
    <div className="card p-5">
      <h2 className="font-heading text-lg font-bold">Order summary</h2>
      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-medium">{formatMoney(totals.subtotal, true)}</dd></div>
        {totals.savings > 0 && <div className="flex justify-between"><dt className="text-muted">You save</dt><dd className="font-medium text-success">− {formatMoney(totals.savings, true)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="font-medium">{totals.shipping === 0 ? 'Free' : formatMoney(totals.shipping, true)}</dd></div>
        <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-bold">Total</dt><dd className="font-brand text-xl font-bold">{formatMoney(totals.total, true)}</dd></div>
      </dl>
      {totals.subtotal > 0 && remaining > 0 && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-brand-soft p-3 text-xs text-brand-dark"><Truck size={15} className="mt-0.5 shrink-0" /> Add {formatMoney(remaining)} more for free delivery.</p>
      )}
      {children}
    </div>
  );
}
