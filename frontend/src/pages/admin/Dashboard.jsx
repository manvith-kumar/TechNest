import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, IndianRupee, Package, ShoppingBag, Users } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminService } from '../../services/adminService';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatCompact, formatDate, formatMoney, formatMonth, titleCase } from '../../utils/format';
import { DashboardCard, PageHeader, Panel } from '../../components/admin/AdminUI';
import { ErrorState } from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { Skeleton } from '../../components/common/Skeletons';

export const STATUS_COLORS = { PLACED: '#356DF3', CONFIRMED: '#7866E8', PROCESSING: '#F59E0B', SHIPPED: '#0EA5E9', DELIVERED: '#12A878', CANCELLED: '#E5484D' };
const axis = { fontSize: 12, fill: '#667085' };

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { data: d, loading, error, reload } = useAsync(() => adminService.dashboard(), []);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading) return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-80" /></div>;

  const monthly = d.monthlySales.map((m) => ({ ...m, revenue: Number(m.revenue), label: formatMonth(m.month) }));
  const cats = d.categorySales.map((c) => ({ ...c, sales: Number(c.sales) }));
  const maxUnits = Math.max(1, ...d.topProducts.map((p) => p.unitsSold));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Live figures from your orders, customers and inventory." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard icon={IndianRupee} label="Total revenue" value={formatMoney(d.totalRevenue)} hint="Excludes cancelled orders" />
        <DashboardCard icon={ShoppingBag} label="Total orders" value={d.totalOrders} tone="violet" />
        <DashboardCard icon={Users} label="Customers" value={d.totalCustomers} tone="success" />
        <DashboardCard icon={Package} label="Products" value={d.totalProducts} />
        <DashboardCard icon={Clock} label="Pending orders" value={d.pendingOrders} tone="warning" hint="Placed, confirmed or processing" />
        <DashboardCard icon={CheckCircle2} label="Delivered orders" value={d.deliveredOrders} tone="success" />
        <DashboardCard icon={AlertTriangle} label="Low stock" value={d.lowStockCount} tone="warning" hint="At or below threshold" />
        <DashboardCard icon={AlertTriangle} label="Out of stock" value={d.outOfStockCount} tone="danger" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Revenue, last 6 months" className="xl:col-span-2">
          <div className="h-72 p-4" role="img" aria-label="Monthly revenue area chart">
            <ResponsiveContainer>
              <AreaChart data={monthly} margin={{ left: 0, right: 8, top: 8 }}>
                <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#356DF3" stopOpacity={0.25} /><stop offset="100%" stopColor="#356DF3" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#E6EAF0" vertical={false} />
                <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
                <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={48} />
                <Tooltip formatter={(v, n) => [n === 'revenue' ? formatMoney(v) : v, n === 'revenue' ? 'Revenue' : 'Orders']} />
                <Area type="monotone" dataKey="revenue" stroke="#356DF3" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Orders by status">
          <div className="h-72 p-2" role="img" aria-label="Order status donut chart">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={d.orderStatusCounts.map((s) => ({ name: titleCase(s.status), value: s.count, key: s.status }))} dataKey="value" innerRadius={58} outerRadius={88} paddingAngle={2}>
                  {d.orderStatusCounts.map((s) => <Cell key={s.status} fill={STATUS_COLORS[s.status]} />)}
                </Pie>
                <Tooltip /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Sales by category" className="xl:col-span-2">
          <div className="h-72 p-4" role="img" aria-label="Category sales bar chart">
            <ResponsiveContainer>
              <BarChart data={cats} layout="vertical" margin={{ left: 12, right: 12 }}>
                <CartesianGrid stroke="#E6EAF0" horizontal={false} />
                <XAxis type="number" tick={axis} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
                <YAxis type="category" dataKey="category" tick={axis} tickLine={false} axisLine={false} width={96} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Bar dataKey="sales" fill="#7866E8" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Top-selling products">
          <ul className="space-y-4 p-5">
            {d.topProducts.length === 0 && <li className="text-sm text-muted">No sales in this period.</li>}
            {d.topProducts.map((p) => (
              <li key={p.productId}>
                <div className="flex justify-between gap-3 text-sm"><span className="truncate font-medium">{p.name}</span><span className="shrink-0 font-label text-muted">{p.unitsSold} sold</span></div>
                <div className="mt-1.5 h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-brand" style={{ width: `${(p.unitsSold / maxUnits) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Recent orders" className="xl:col-span-2" actions={<Link to="/admin/orders" className="font-label text-sm font-semibold text-brand">View all</Link>}>
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><tbody className="divide-y divide-line">
            {d.recentOrders.map((o) => (
              <tr key={o.id}><td className="px-5 py-3 font-brand font-semibold">{o.orderNumber}</td><td className="px-2 py-3">{o.customer.name}</td><td className="px-2 py-3 text-muted">{formatDate(o.placedAt)}</td><td className="px-2 py-3 font-brand font-semibold">{formatMoney(o.totalAmount)}</td><td className="px-5 py-3"><StatusBadge status={o.status} /></td></tr>
            ))}
          </tbody></table></div>
        </Panel>
        <Panel title="Low-stock products" actions={<Link to="/admin/inventory?status=low" className="font-label text-sm font-semibold text-brand">Manage</Link>}>
          <ul className="divide-y divide-line">
            {d.lowStockProducts.length === 0 && <li className="p-5 text-sm text-muted">Every product is comfortably stocked.</li>}
            {d.lowStockProducts.map((p) => (
              <li key={p.productId} className="flex items-center justify-between gap-3 px-5 py-3 text-sm"><span className="truncate">{p.name}</span><span className={`badge shrink-0 ${p.stockQuantity === 0 ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-amber-700'}`}>{p.stockQuantity === 0 ? 'Out' : `${p.stockQuantity} left`}</span></li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
