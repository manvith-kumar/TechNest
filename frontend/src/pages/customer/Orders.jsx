import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService } from '../../services/shopService';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../utils/errors';
import { PAYMENT_LABELS } from '../../utils/constants';
import { formatDate, formatMoney } from '../../utils/format';
import EmptyState, { ErrorState } from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import { Skeleton } from '../../components/common/Skeletons';
import { useConfirm } from '../../components/common/ConfirmationModal';

export default function Orders() {
  useDocumentTitle('My orders');
  const [page, setPage] = useState(0);
  const { data, loading, error, reload } = useAsync(() => orderService.mine(page, 6), [page]);
  const confirm = useConfirm();

  const cancel = async (o) => {
    if (!(await confirm({ title: `Cancel order ${o.orderNumber}?`, message: 'The items go back into stock and any simulated payment is refunded. This cannot be undone.', confirmLabel: 'Cancel order', cancelLabel: 'Keep order' }))) return;
    try { await orderService.cancel(o.id); toast.success('Order cancelled'); reload(); } catch (err) { toast.error(getErrorMessage(err)); reload(); }
  };

  return (
    <div className="container-page py-8">
      <h1 className="font-heading text-3xl font-extrabold">My orders</h1>
      <div className="mt-6 space-y-4">
        {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && !data.content.length && <EmptyState icon={PackageSearch} title="No orders yet" message="When you place an order it will show up here with live tracking." action={<Link to="/shop" className="btn-primary">Start shopping</Link>} />}
        {data?.content.map((o) => (
          <article key={o.id} className="card overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3 text-sm">
              <div className="flex flex-wrap gap-x-8 gap-y-1">
                <div><p className="text-xs text-muted">Order</p><p className="font-brand font-bold">{o.orderNumber}</p></div>
                <div><p className="text-xs text-muted">Placed</p><p className="font-medium">{formatDate(o.placedAt)}</p></div>
                <div><p className="text-xs text-muted">Total</p><p className="font-brand font-bold">{formatMoney(o.totalAmount, true)}</p></div>
                <div><p className="text-xs text-muted">Payment</p><p className="font-medium">{PAYMENT_LABELS[o.payment.method]} · {o.payment.status.toLowerCase()}</p></div>
              </div>
              <StatusBadge status={o.status} />
            </header>
            <div className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex -space-x-2">
                {o.items.slice(0, 4).map((i) => <ImageWithFallback key={i.id} src={i.imageUrl} alt={i.name} label={i.name} className="h-14 w-14 rounded-lg border-2 border-white bg-surface object-cover" />)}
                {o.items.length > 4 && <span className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-white bg-line font-label text-xs font-bold">+{o.items.length - 4}</span>}
              </div>
              <p className="min-w-0 flex-1 truncate text-sm text-slate2">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</p>
              <div className="flex gap-2">
                <Link to={`/orders/${o.id}`} className="btn-outline btn-sm">View details</Link>
                {o.customerCancellable && <button className="btn-ghost btn-sm text-danger" onClick={() => cancel(o)}>Cancel</button>}
              </div>
            </div>
          </article>
        ))}
      </div>
      <Pagination page={data?.page ?? 0} totalPages={data?.totalPages} onChange={setPage} />
    </div>
  );
}
