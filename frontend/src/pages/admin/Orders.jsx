import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../utils/errors';
import { ORDER_STATUSES, PAYMENT_LABELS } from '../../utils/constants';
import { formatDate, formatDateTime, formatMoney, titleCase } from '../../utils/format';
import { PageHeader, Panel, Toolbar } from '../../components/admin/AdminUI';
import DataTable from '../../components/common/DataTable';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import Modal from '../../components/common/Modal';
import OrderTimeline from '../../components/common/OrderTimeline';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import { useConfirm } from '../../components/common/ConfirmationModal';

function OrderModal({ orderId, onClose, onChanged }) {
  const confirm = useConfirm();
  const { data: o, loading, error, setData } = useAsync(() => adminService.order(orderId), [orderId]);
  const [next, setNext] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const apply = async (status) => {
    if (status === 'CANCELLED' && !(await confirm({ title: `Cancel ${o.orderNumber}?`, message: 'Stock is returned to inventory exactly once and any simulated payment is refunded.', confirmLabel: 'Cancel order', cancelLabel: 'Keep order' }))) return;
    setBusy(true);
    try { setData(await adminService.updateOrderStatus(o.id, status, note.trim() || null)); toast.success(`Order marked ${titleCase(status).toLowerCase()}`); setNote(''); setNext(''); onChanged(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  const forward = o?.nextStatuses.filter((s) => s !== 'CANCELLED') || [];
  const canCancel = o?.nextStatuses.includes('CANCELLED');

  return (
    <Modal open onClose={onClose} size="xl" title={o ? `Order ${o.orderNumber}` : 'Order'}>
      {loading && <p className="text-sm text-muted">Loading order</p>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {o && (
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3"><StatusBadge status={o.status} /><span className="text-sm text-muted">Placed {formatDateTime(o.placedAt)}</span></div>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-surface p-4"><p className="font-nav font-bold">Customer</p>{o.customer.name}<br /><span className="text-muted">{o.customer.email}</span><br /><span className="text-muted">{o.customer.phone || 'No phone'}</span></div>
              <div className="rounded-xl bg-surface p-4"><p className="font-nav font-bold">Ship to</p>{o.shippingAddress.name}<br />{o.shippingAddress.line1}, {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.postalCode}<br /><span className="text-muted">{o.shippingAddress.phone}</span></div>
            </div>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {o.items.map((i) => <li key={i.id} className="flex items-center gap-3 p-3 text-sm"><ImageWithFallback src={i.imageUrl} alt="" label={i.name} className="h-11 w-11 rounded-lg bg-surface object-cover" /><span className="min-w-0 flex-1 truncate">{i.name} × {i.quantity}</span><span className="font-brand font-semibold">{formatMoney(i.lineTotal, true)}</span></li>)}
              <li className="flex justify-between bg-surface p-3 text-sm"><span>Delivery {Number(o.shippingFee) === 0 ? '(free)' : formatMoney(o.shippingFee, true)}</span><span className="font-brand font-bold">Total {formatMoney(o.totalAmount, true)}</span></li>
            </ul>
            <div className="rounded-xl bg-surface p-4 text-sm"><p className="font-nav font-bold">Payment</p>{PAYMENT_LABELS[o.payment.method]} <StatusBadge status={o.payment.status} />{o.payment.simulated && <span className="ml-2 text-xs text-violet2">Simulated · {o.payment.transactionRef}</span>}</div>

            {(forward.length > 0 || canCancel) ? (
              <div className="rounded-xl border border-line p-4">
                <p className="mb-3 font-nav text-sm font-bold">Update status</p>
                <div className="flex flex-wrap gap-2">
                  <select className="input w-auto" value={next} onChange={(e) => setNext(e.target.value)} aria-label="New status"><option value="">Choose next status</option>{forward.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</select>
                  <input className="input min-w-[200px] flex-1" placeholder="Note for the timeline (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} aria-label="Status note" />
                  <button className="btn-primary" disabled={!next || busy} onClick={() => apply(next)}>Update</button>
                  {canCancel && <button className="btn-outline text-danger" disabled={busy} onClick={() => apply('CANCELLED')}>Cancel order</button>}
                </div>
              </div>
            ) : <p className="rounded-lg bg-surface p-3 text-sm text-muted">This order is {o.status.toLowerCase()} and can no longer change.</p>}
          </div>
          <div><p className="mb-4 font-nav text-sm font-bold">Timeline</p><OrderTimeline status={o.status} history={o.history} /></div>
        </div>
      )}
    </Modal>
  );
}

export default function Orders() {
  useDocumentTitle('Orders');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState(null);
  const dq = useDebounce(q);
  useEffect(() => setPage(0), [dq, status, from, to]);
  const { data, loading, error, reload } = useAsync(() => adminService.orders({ q: dq, status, from, to, page, size: 10 }), [dq, status, from, to, page]);

  const columns = [
    { key: 'n', header: 'Order', render: (o) => <span className="font-brand font-semibold">{o.orderNumber}</span> },
    { key: 'c', header: 'Customer', render: (o) => <div><p className="font-medium">{o.customer.name}</p><p className="text-xs text-muted">{o.customer.email}</p></div> },
    { key: 'd', header: 'Placed', render: (o) => formatDate(o.placedAt) },
    { key: 'i', header: 'Items', render: (o) => o.items.reduce((s, i) => s + i.quantity, 0) },
    { key: 't', header: 'Total', render: (o) => <span className="font-brand font-semibold">{formatMoney(o.totalAmount)}</span> },
    { key: 'p', header: 'Payment', render: (o) => <div><p className="text-xs">{PAYMENT_LABELS[o.payment.method]}</p><StatusBadge status={o.payment.status} /></div> },
    { key: 's', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
  ];
  return (
    <>
      <PageHeader title="Orders" subtitle="Search, review and move orders through fulfilment." />
      <Panel>
        <Toolbar>
          <input className="input max-w-xs" placeholder="Order number, customer or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"><option value="">All statuses</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</select>
          <label className="flex items-center gap-2 text-sm text-muted">From <input type="date" className="input w-auto py-2" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="flex items-center gap-2 text-sm text-muted">To <input type="date" className="input w-auto py-2" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        </Toolbar>
        {error ? <p role="alert" className="p-6 text-sm text-danger">{error} <button className="font-semibold underline" onClick={reload}>Retry</button></p> : <DataTable columns={columns} rows={data?.content} loading={loading} onRowClick={(o) => setOpenId(o.id)} />}
      </Panel>
      <Pagination page={data?.page ?? 0} totalPages={data?.totalPages} onChange={setPage} />
      {openId && <OrderModal orderId={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
    </>
  );
}
