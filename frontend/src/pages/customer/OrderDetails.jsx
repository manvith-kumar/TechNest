import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderService } from '../../services/shopService';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../utils/errors';
import { PAYMENT_LABELS } from '../../utils/constants';
import { formatDateTime, formatMoney } from '../../utils/format';
import { ErrorState } from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import OrderTimeline from '../../components/common/OrderTimeline';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import { Skeleton } from '../../components/common/Skeletons';
import { useConfirm } from '../../components/common/ConfirmationModal';

export default function OrderDetails() {
  const { id } = useParams();
  const { data: o, loading, error, reload } = useAsync(() => orderService.get(id), [id]);
  const confirm = useConfirm();
  useDocumentTitle(o ? `Order ${o.orderNumber}` : 'Order');

  if (loading) return <div className="container-page py-10"><Skeleton className="h-96" /></div>;
  if (error) return <div className="container-page py-10"><ErrorState message={error} onRetry={reload} /></div>;

  const cancel = async () => {
    if (!(await confirm({ title: 'Cancel this order?', message: 'The items go back into stock and any simulated payment is refunded.', confirmLabel: 'Cancel order', cancelLabel: 'Keep order' }))) return;
    try { await orderService.cancel(o.id); toast.success('Order cancelled'); } catch (err) { toast.error(getErrorMessage(err)); }
    reload();
  };

  return (
    <div className="container-page py-8">
      <Link to="/orders" className="text-sm font-semibold text-brand">← All orders</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-heading text-3xl font-extrabold">Order {o.orderNumber}</h1><p className="text-sm text-muted">Placed {formatDateTime(o.placedAt)}</p></div>
        <div className="flex items-center gap-3"><StatusBadge status={o.status} />{o.customerCancellable && <button className="btn-outline btn-sm text-danger" onClick={cancel}>Cancel order</button>}</div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card divide-y divide-line">
            <h2 className="p-5 font-heading text-lg font-bold">Items</h2>
            {o.items.map((i) => (
              <div key={i.id} className="flex items-center gap-4 p-5">
                <ImageWithFallback src={i.imageUrl} alt={i.name} label={i.name} className="h-16 w-16 rounded-lg bg-surface object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${i.productId}`} className="font-heading font-bold hover:text-brand">{i.name}</Link>
                  <p className="text-sm text-muted">{formatMoney(i.unitPrice, true)} × {i.quantity}</p>
                  {o.status === 'DELIVERED' && <Link to={`/product/${i.productId}#reviews-h`} className="text-sm font-semibold text-brand">{i.reviewed ? 'Edit your review' : 'Write a review'}</Link>}
                </div>
                <p className="font-brand font-bold">{formatMoney(i.lineTotal, true)}</p>
              </div>
            ))}
            <dl className="space-y-2 p-5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(o.subtotal, true)}</dd></div>
              {Number(o.discountTotal) > 0 && <div className="flex justify-between"><dt className="text-muted">Savings included</dt><dd className="text-success">{formatMoney(o.discountTotal, true)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{Number(o.shippingFee) === 0 ? 'Free' : formatMoney(o.shippingFee, true)}</dd></div>
              <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd className="font-brand">{formatMoney(o.totalAmount, true)}</dd></div>
            </dl>
          </section>
          <section className="card grid gap-5 p-5 text-sm sm:grid-cols-2">
            <div><h2 className="font-nav font-bold">Delivery address</h2><p className="mt-1 text-slate2">{o.shippingAddress.name}<br />{o.shippingAddress.line1}{o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ''}<br />{o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.postalCode}<br />{o.shippingAddress.phone}</p></div>
            <div><h2 className="font-nav font-bold">Payment</h2><p className="mt-1 text-slate2">{PAYMENT_LABELS[o.payment.method]}<br /><StatusBadge status={o.payment.status} />{o.payment.simulated && <span className="mt-2 block text-xs text-violet2">Simulated payment · ref {o.payment.transactionRef}</span>}</p></div>
          </section>
        </div>
        <section className="card h-fit p-5"><h2 className="mb-5 font-heading text-lg font-bold">Tracking</h2><OrderTimeline status={o.status} history={o.history} /></section>
      </div>
    </div>
  );
}
