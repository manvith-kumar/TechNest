import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { History, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../utils/errors';
import { formatDateTime, titleCase } from '../../utils/format';
import { PageHeader, Panel, Toolbar } from '../../components/admin/AdminUI';
import DataTable from '../../components/common/DataTable';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';

const STATUS = { IN_STOCK: ['In stock', 'bg-success-soft text-success'], LOW: ['Low stock', 'bg-warning-soft text-amber-700'], OUT: ['Out of stock', 'bg-danger-soft text-danger'] };

function AdjustModal({ row, onClose, onDone }) {
  const [mode, setMode] = useState('add');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const n = Number(qty);
  const delta = mode === 'add' ? n : -n;
  const after = row.stockQuantity + (Number.isFinite(delta) ? delta : 0);
  const valid = Number.isInteger(n) && n > 0 && after >= 0;
  const submit = async (e) => {
    e.preventDefault(); if (!valid) return; setBusy(true);
    try { await adminService.adjustStock(row.productId, { delta, reason: mode === 'add' ? 'RESTOCK' : 'ADJUSTMENT', note: note.trim() || null }); toast.success('Stock updated'); onDone(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} size="sm" title={`Adjust stock: ${row.name}`} footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" form="adj-form" disabled={!valid || busy}>{busy ? 'Saving' : 'Apply change'}</button></>}>
      <form id="adj-form" onSubmit={submit} className="space-y-4">
        <div className="flex gap-2" role="radiogroup" aria-label="Adjustment type">
          {[['add', 'Add stock'], ['remove', 'Remove stock']].map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={mode === k} onClick={() => setMode(k)} className={`flex-1 rounded-lg border-2 py-2 font-label text-sm font-semibold ${mode === k ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line'}`}>{l}</button>)}
        </div>
        <div><label className="label" htmlFor="adj-q">Quantity</label><input id="adj-q" type="number" min="1" step="1" className="input" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus /></div>
        <div><label className="label" htmlFor="adj-n">Note (optional)</label><input id="adj-n" className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="e.g. Supplier delivery, damaged units" /></div>
        <p className={`rounded-lg p-3 text-sm ${after < 0 ? 'bg-danger-soft text-danger' : 'bg-surface text-slate2'}`}>{after < 0 ? 'Stock cannot go below zero.' : <>Stock will change from <b>{row.stockQuantity}</b> to <b>{valid ? after : row.stockQuantity}</b>.</>}</p>
      </form>
    </Modal>
  );
}

function HistoryModal({ row, onClose }) {
  const [page, setPage] = useState(0);
  const { data, loading } = useAsync(() => adminService.stockHistory(row.productId, page), [row.productId, page]);
  return (
    <Modal open onClose={onClose} size="lg" title={`Stock history: ${row.name}`}>
      <DataTable loading={loading} rows={data?.content} columns={[
        { key: 'date', header: 'When', render: (h) => formatDateTime(h.createdAt) },
        { key: 'delta', header: 'Change', render: (h) => <span className={`font-brand font-semibold ${h.delta > 0 ? 'text-success' : 'text-danger'}`}>{h.delta > 0 ? '+' : ''}{h.delta}</span> },
        { key: 'after', header: 'Stock after', render: (h) => h.quantityAfter },
        { key: 'reason', header: 'Reason', render: (h) => titleCase(h.reason) },
        { key: 'note', header: 'Note', render: (h) => h.note || '-' },
      ]} />
      <Pagination page={data?.page ?? 0} totalPages={data?.totalPages} onChange={setPage} />
    </Modal>
  );
}

export default function Inventory() {
  useDocumentTitle('Inventory');
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [adjust, setAdjust] = useState(null);
  const [history, setHistory] = useState(null);
  const status = params.get('status') || 'all';
  const dq = useDebounce(q);
  useEffect(() => setPage(0), [dq, status]);
  const { data, loading, error, reload } = useAsync(() => adminService.inventory({ q: dq, status, page, size: 10 }), [dq, status, page]);

  const columns = [
    { key: 'name', header: 'Product', render: (r) => <div className="flex items-center gap-3"><ImageWithFallback src={r.imageUrl} alt="" label={r.name} className="h-10 w-10 rounded-lg bg-surface object-cover" /><div className="min-w-0"><p className="max-w-[260px] truncate font-semibold">{r.name}</p><p className="text-xs text-muted">{r.brand} · {r.categoryName}</p></div></div> },
    { key: 'stock', header: 'In stock', render: (r) => <span className="font-brand text-lg font-bold">{r.stockQuantity}</span> },
    { key: 'threshold', header: 'Low-stock at', render: (r) => r.lowStockThreshold },
    { key: 'status', header: 'Status', render: (r) => <span className={`badge ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}</span> },
    { key: 'actions', header: '', className: 'text-right', render: (r) => <div className="flex justify-end gap-1"><button className="btn-outline btn-sm" onClick={() => setAdjust(r)}><SlidersHorizontal size={14} /> Adjust</button><button className="btn-ghost btn-sm" onClick={() => setHistory(r)} aria-label={`History for ${r.name}`}><History size={15} /></button></div> },
  ];
  return (
    <>
      <PageHeader title="Inventory" subtitle="Every change is recorded. Stock can never go below zero." />
      <Panel>
        <Toolbar>
          <input className="input max-w-xs" placeholder="Search name or brand" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search inventory" />
          <div className="flex gap-1" role="group" aria-label="Stock filter">
            {[['all', 'All'], ['low', 'Low stock'], ['out', 'Out of stock'], ['in', 'Healthy']].map(([k, l]) => <button key={k} onClick={() => setParams(k === 'all' ? {} : { status: k })} aria-pressed={status === k} className={`rounded-lg px-3 py-1.5 font-label text-sm font-semibold ${status === k ? 'bg-navy text-white' : 'text-slate2 hover:bg-line/60'}`}>{l}</button>)}
          </div>
        </Toolbar>
        {error ? <p role="alert" className="p-6 text-sm text-danger">{error} <button className="font-semibold underline" onClick={reload}>Retry</button></p> : <DataTable columns={columns} rows={data?.content} loading={loading} rowKey="productId" />}
      </Panel>
      <Pagination page={data?.page ?? 0} totalPages={data?.totalPages} onChange={setPage} />
      {adjust && <AdjustModal row={adjust} onClose={() => setAdjust(null)} onDone={() => { setAdjust(null); reload(); }} />}
      {history && <HistoryModal row={history} onClose={() => setHistory(null)} />}
    </>
  );
}
