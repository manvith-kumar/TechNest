import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminService } from '../../services/adminService';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { PAYMENT_LABELS } from '../../utils/constants';
import { formatCompact, formatMoney, formatMonth, titleCase, toISODate } from '../../utils/format';
import { DashboardCard, PageHeader, Panel } from '../../components/admin/AdminUI';
import { ErrorState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeletons';
import { IndianRupee, Receipt, ShoppingBag } from 'lucide-react';

const axis = { fontSize: 12, fill: '#667085' };

export default function Reports() {
  useDocumentTitle('Reports');
  const today = new Date();
  const [from, setFrom] = useState(toISODate(new Date(today.getFullYear(), today.getMonth() - 5, 2)));
  const [to, setTo] = useState(toISODate(today));
  const [applied, setApplied] = useState({ from, to });
  const { data: r, loading, error, reload } = useAsync(() => adminService.reports(applied.from, applied.to), [applied.from, applied.to]);

  const presets = [['Last 30 days', 30], ['Last 90 days', 90], ['Last 6 months', 183], ['Last 12 months', 365]];
  const preset = (days) => { const t = new Date(); const f = new Date(); f.setDate(f.getDate() - days); setFrom(toISODate(f)); setTo(toISODate(t)); setApplied({ from: toISODate(f), to: toISODate(t) }); };

  return (
    <>
      <PageHeader title="Reports and analytics" subtitle="Sales, customers and inventory for the selected period." />
      <div className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <label className="text-sm">From<input type="date" className="input mt-1" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-sm">To<input type="date" className="input mt-1" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
        <button className="btn-primary" onClick={() => setApplied({ from, to })} disabled={!from || !to || from > to}>Apply</button>
        <div className="ml-auto flex flex-wrap gap-1">{presets.map(([l, d]) => <button key={l} className="btn-ghost btn-sm" onClick={() => preset(d)}>{l}</button>)}</div>
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && <Skeleton className="h-96" />}
      {r && !loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <DashboardCard icon={IndianRupee} label="Total sales" value={formatMoney(r.totalSales)} hint="Excludes cancelled orders" />
            <DashboardCard icon={ShoppingBag} label="Orders" value={r.totalOrders} tone="violet" />
            <DashboardCard icon={Receipt} label="Average order value" value={formatMoney(r.averageOrderValue)} tone="success" />
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Panel title="Monthly revenue"><div className="h-72 p-4" role="img" aria-label="Monthly revenue bar chart"><ResponsiveContainer><BarChart data={r.monthlyRevenue.map((m) => ({ label: formatMonth(m.month), revenue: Number(m.revenue) }))}><CartesianGrid stroke="#E6EAF0" vertical={false} /><XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} /><YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={48} /><Tooltip formatter={(v) => formatMoney(v)} /><Bar dataKey="revenue" fill="#356DF3" radius={[6, 6, 0, 0]} barSize={28} /></BarChart></ResponsiveContainer></div></Panel>
            <Panel title="Customer growth"><div className="h-72 p-4" role="img" aria-label="New customers per month line chart"><ResponsiveContainer><LineChart data={r.customerGrowth.map((g) => ({ label: formatMonth(g.month), customers: g.newCustomers }))}><CartesianGrid stroke="#E6EAF0" vertical={false} /><XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} width={32} /><Tooltip /><Line type="monotone" dataKey="customers" name="New customers" stroke="#7866E8" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div></Panel>
            <Panel title="Best-selling products"><ol className="divide-y divide-line">{r.topProducts.map((p, i) => <li key={p.productId} className="flex items-center gap-3 px-5 py-3 text-sm"><span className="w-5 font-label text-muted">{i + 1}</span><span className="min-w-0 flex-1 truncate font-medium">{p.name}</span><span className="text-muted">{p.unitsSold} sold</span><span className="w-24 text-right font-brand font-semibold">{formatMoney(p.revenue)}</span></li>)}{!r.topProducts.length && <li className="p-5 text-sm text-muted">No sales in this period.</li>}</ol></Panel>
            <Panel title="Top categories"><ol className="divide-y divide-line">{r.topCategories.map((c, i) => <li key={c.category} className="flex items-center gap-3 px-5 py-3 text-sm"><span className="w-5 font-label text-muted">{i + 1}</span><span className="flex-1 font-medium">{c.category}</span><span className="font-brand font-semibold">{formatMoney(c.sales)}</span></li>)}{!r.topCategories.length && <li className="p-5 text-sm text-muted">No sales in this period.</li>}</ol></Panel>
            <Panel title="Inventory status"><div className="grid grid-cols-3 gap-3 p-5 text-center">{[['Healthy', r.inventory.inStock, 'text-success'], ['Low stock', r.inventory.lowStock, 'text-amber-600'], ['Out of stock', r.inventory.outOfStock, 'text-danger']].map(([l, v, c]) => <div key={l} className="rounded-xl bg-surface p-4"><p className={`font-brand text-3xl font-bold ${c}`}>{v}</p><p className="text-xs text-muted">{l}</p></div>)}</div><p className="px-5 pb-5 text-xs text-muted">Current snapshot across {r.inventory.total} active products.</p></Panel>
            <Panel title="Payment methods and order outcomes"><div className="grid gap-5 p-5 sm:grid-cols-2"><div><p className="mb-2 font-nav text-sm font-bold">Payment split</p>{r.paymentSplit.map((p) => <p key={p.method} className="flex justify-between border-b border-line py-2 text-sm"><span>{PAYMENT_LABELS[p.method]} ({p.orders})</span><span className="font-brand font-semibold">{formatMoney(p.amount)}</span></p>)}{!r.paymentSplit.length && <p className="text-sm text-muted">No orders.</p>}</div><div><p className="mb-2 font-nav text-sm font-bold">Orders by status</p>{r.orderStatusCounts.map((s) => <p key={s.status} className="flex justify-between border-b border-line py-2 text-sm"><span>{titleCase(s.status)}</span><span className="font-brand font-semibold">{s.count}</span></p>)}</div></div></Panel>
          </div>
        </>
      )}
    </>
  );
}
