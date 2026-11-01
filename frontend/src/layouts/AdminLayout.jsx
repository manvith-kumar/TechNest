import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Boxes, ChevronsLeft, ChevronsRight, LayoutDashboard, LogOut, Menu, MessageSquareWarning, Package, ShoppingBag, Store, Tags, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/layout/Logo';

const NAV = [
  ['/admin', 'Dashboard', LayoutDashboard, true],
  ['/admin/products', 'Products', Package],
  ['/admin/categories', 'Categories', Tags],
  ['/admin/inventory', 'Inventory', Boxes],
  ['/admin/orders', 'Orders', ShoppingBag],
  ['/admin/customers', 'Customers', Users],
  ['/admin/reviews', 'Reviews', MessageSquareWarning],
  ['/admin/reports', 'Reports', BarChart3],
];

function Sidebar({ collapsed, onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Admin">
      {NAV.map(([to, label, Icon, end]) => (
        <NavLink key={to} to={to} end={end} onClick={onNavigate} title={collapsed ? label : undefined}
          className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 font-nav text-sm font-semibold transition-colors ${isActive ? 'bg-brand text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'} ${collapsed ? 'justify-center' : ''}`}>
          <Icon size={18} aria-hidden="true" />{!collapsed && label}{collapsed && <span className="sr-only">{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-navy transition-[width] lg:flex ${collapsed ? 'w-[72px]' : 'w-64'}`}>
        <div className={`flex h-16 items-center border-b border-white/10 ${collapsed ? 'justify-center' : 'px-5'}`}>{collapsed ? <span className="font-brand text-lg font-bold text-white">T</span> : <Logo light />}</div>
        <Sidebar collapsed={collapsed} />
        <button onClick={() => setCollapsed(!collapsed)} className="m-3 flex items-center justify-center gap-2 rounded-lg py-2 text-sm text-slate-400 hover:bg-white/10 hover:text-white" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronsRight size={18} /> : <><ChevronsLeft size={18} /> Collapse</>}
        </button>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-navy/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-navy">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5"><Logo light /><button onClick={() => setOpen(false)} className="text-slate-300" aria-label="Close menu"><X size={20} /></button></div>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white px-4 sm:px-6">
          <button className="rounded-lg p-2 hover:bg-line/60 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <p className="font-nav text-sm font-semibold text-muted">Admin console</p>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/" className="btn-ghost btn-sm"><Store size={15} /> View store</Link>
            <span className="hidden text-right sm:block"><span className="block font-nav text-sm font-bold leading-tight">{user.fullName}</span><span className="block text-xs text-muted">Administrator</span></span>
            <button className="btn-outline btn-sm" onClick={async () => { await logout(); navigate('/login'); }}><LogOut size={15} /><span className="hidden sm:inline">Sign out</span></button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
