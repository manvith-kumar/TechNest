import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatMoney } from '../../utils/format';
import { PageHeader, Panel, Toolbar } from '../../components/admin/AdminUI';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import { useConfirm } from '../../components/common/ConfirmationModal';

function CustomerModal({ id, onClose, onChanged }) {
  const confirm = useConfirm();
  const { data, loading, error, reload } = useAsync(() => adminService.customer(id), [id]);
  const toggle = async () => {
    const c = data.customer;
    if (c.enabled && !(await confirm({ title: `Deactivate ${c.fullName}?`, message: 'They will be signed out and unable to sign in until reactivated. Their orders are kept.', confirmLabel: 'Deactivate' }))) return;
    try { await adminService.setCustomerStatus(c.id, !c.enabled); toast.success(c.enabled ? 'Account deactivated' : 'Account reactivated'); reload(); onChanged(); } catch (err) { toast.error(getErrorMessage(err)); }
  };
  const c = data?.customer;
  return (
    <Modal open onClose={onClose} size="lg" title={c?.fullName || 'Customer'}>
      {loading && <p className="text-sm text-muted">Loading</p>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {c && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm"><p>{c.email}</p><p className="text-muted">{c.phone || 'No phone'} · joined {formatDate(c.createdAt)}</p></div>
            <div className="flex items-center gap-3"><span className={`badge ${c.enabled ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{c.enabled ? 'Active' : 'Deactivated'}</span><button className={c.enabled ? 'btn-outline btn-sm text-danger' : 'btn-primary btn-sm'} onClick={toggle}>{c.enabled ? 'Deactivate' : 'Reactivate'}</button></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-surface p-4"><p className="text-xs text-muted">Orders</p><p className="font-brand text-xl font-bold">{c.orderCount}</p></div><div className="rounded-xl bg-surface p-4"><p className="text-xs text-muted">Total spent (excl. cancelled)</p><p className="font-brand text-xl font-bold">{formatMoney(c.totalSpent)}</p></div></div>
          <div><h3 className="mb-2 font-nav text-sm font-bold">Recent purchases</h3>
            {data.recentOrders.length === 0 ? <p className="text-sm text-muted">No orders yet.</p> : (
              <ul className="divide-y divide-line rounded-xl border border-line text-sm">{data.recentOrders.map((o) => <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"><span className="font-brand font-semibold">{o.orderNumber}</span><span className="text-muted">{formatDate(o.placedAt)}</span><span className="font-brand font-semibold">{formatMoney(o.totalAmount)}</span><StatusBadge status={o.status} /></li>)}</ul>
            )}
          </div>
          <div><h3 className="mb-2 font-nav text-sm font-bold">Saved addresses ({data.addresses.length})</h3>
            <div className="grid gap-3 sm:grid-cols-2">{data.addresses.map((a) => <div key={a.id} className="rounded-xl border border-line p-3 text-sm"><p className="font-semibold">{a.label}{a.defaultAddress && ' · default'}</p><p className="text-muted">{a.line1}, {a.city}, {a.state} {a.postalCode}</p></div>)}</div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Customers() {
  useDocumentTitle('Customers');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState(null);
  const dq = useDebounce(q);
  useEffect(() => setPage(0), [dq]);
  const { data, loading, error, reload } = useAsync(() => adminService.customers({ q: dq, page, size: 10 }), [dq, page]);
  const columns = [
    { key: 'n', header: 'Customer', render: (c) => <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-label text-sm font-bold text-white">{c.fullName.charAt(0).toUpperCase()}</span><div><p className="font-semibold">{c.fullName}</p><p className="text-xs text-muted">{c.email}</p></div></div> },
    { key: 'j', header: 'Joined', render: (c) => formatDate(c.createdAt) },
    { key: 'o', header: 'Orders', render: (c) => c.orderCount },
    { key: 's', header: 'Spent', render: (c) => <span className="font-brand font-semibold">{formatMoney(c.totalSpent)}</span> },
    { key: 'st', header: 'Status', render: (c) => <span className={`badge ${c.enabled ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>{c.enabled ? 'Active' : 'Deactivated'}</span> },
  ];
  return (
    <>
      <PageHeader title="Customers" subtitle="Customer accounts and their purchase history." />
      <Panel>
        <Toolbar><input className="input max-w-sm" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search customers" /></Toolbar>
        {error ? <p role="alert" className="p-6 text-sm text-danger">{error} <button className="font-semibold underline" onClick={reload}>Retry</button></p> : <DataTable columns={columns} rows={data?.content} loading={loading} onRowClick={(c) => setOpenId(c.id)} />}
      </Panel>
      <Pagination page={data?.page ?? 0} totalPages={data?.totalPages} onChange={setPage} />
      {openId && <CustomerModal id={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
    </>
  );
}
