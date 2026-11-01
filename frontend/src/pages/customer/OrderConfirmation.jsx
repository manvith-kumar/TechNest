import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { orderService } from '../../services/shopService';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { PAYMENT_LABELS } from '../../utils/constants';
import { formatDateTime, formatMoney } from '../../utils/format';
import { ErrorState } from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { Skeleton } from '../../components/common/Skeletons';

export default function OrderConfirmation() {
  useDocumentTitle('Order confirmed');
  const { id } = useParams();
  const { data: o, loading, error, reload } = useAsync(() => orderService.get(id), [id]);
  if (loading) return <div className="container-page py-10"><Skeleton className="h-80" /></div>;
  if (error) return <div className="container-page py-10"><ErrorState message={error} onRetry={reload} /></div>;
  return (
    <div className="container-page max-w-3xl py-10">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success"><CheckCircle2 size={34} /></span>
        <h1 className="mt-4 font-heading text-3xl font-extrabold">Thank you, your order is placed</h1>
        <p className="mt-2 text-muted">Order <b className="font-brand text-ink">{o.orderNumber}</b> · {formatDateTime(o.placedAt)}</p>
      </div>
      <div className="card mt-8 divide-y divide-line">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5"><span className="text-sm text-muted">Status</span><StatusBadge status={o.status} /></div>
        <ul className="divide-y divide-line">{o.items.map((i) => <li key={i.id} className="flex justify-between gap-4 px-5 py-3 text-sm"><span>{i.name} × {i.quantity}</span><span className="font-medium">{formatMoney(i.lineTotal, true)}</span></li>)}</ul>
        <dl className="space-y-2 p-5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(o.subtotal, true)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{Number(o.shippingFee) === 0 ? 'Free' : formatMoney(o.shippingFee, true)}</dd></div>
          <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd className="font-brand">{formatMoney(o.totalAmount, true)}</dd></div>
        </dl>
        <div className="grid gap-4 p-5 text-sm sm:grid-cols-2">
          <div><p className="font-nav font-bold">Delivering to</p><p className="text-slate2">{o.shippingAddress.name}<br />{o.shippingAddress.line1}, {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.postalCode}</p></div>
          <div><p className="font-nav font-bold">Payment</p><p className="text-slate2">{PAYMENT_LABELS[o.payment.method]} · {o.payment.status.toLowerCase()}{o.payment.simulated && <><br /><span className="text-violet2">Simulated payment ref {o.payment.transactionRef}</span></>}</p></div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to={`/orders/${o.id}`} className="btn-primary">Track this order</Link>
        <Link to="/shop" className="btn-outline">Continue shopping</Link>
      </div>
    </div>
  );
}
