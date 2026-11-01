import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, User, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { categoryService } from '../../services/catalogService';
import Logo from './Logo';
import SearchBar from './SearchBar';

const linkCls = ({ isActive }) =>
  `font-nav text-sm font-semibold transition-colors ${isActive ? 'text-brand' : 'text-slate2 hover:text-ink'}`;

function CountBadge({ n }) {
  if (!n) return null;
  return <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 font-label text-[11px] font-bold text-white">{n > 99 ? '99+' : n}</span>;
}

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [catOpen, setCatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const catRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => { categoryService.list().then(setCategories).catch(() => {}); }, []);
  useEffect(() => { setCatOpen(false); setMenuOpen(false); setMobileOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    const close = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const doLogout = async () => { await logout(); toast.success('You have been signed out.'); navigate('/'); };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4 lg:gap-8">
        <button className="rounded-lg p-2 text-slate2 hover:bg-line/60 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          <NavLink to="/" end className={linkCls}>Home</NavLink>
          <NavLink to="/shop" className={linkCls}>Shop</NavLink>
          <div ref={catRef} className="relative">
            <button onClick={() => setCatOpen((o) => !o)} aria-expanded={catOpen} aria-haspopup="true"
              className="inline-flex items-center gap-1 font-nav text-sm font-semibold text-slate2 hover:text-ink">
              Categories <ChevronDown size={15} className={`transition-transform ${catOpen ? 'rotate-180' : ''}`} />
            </button>
            {catOpen && (
              <div className="absolute left-1/2 top-full z-50 mt-3 w-[560px] -translate-x-1/2 rounded-2xl border border-line bg-white p-4 shadow-lift">
                <div className="grid grid-cols-2 gap-1">
                  {categories.map((c) => (
                    <Link key={c.id} to={`/shop?categoryId=${c.id}`} className="rounded-lg px-3 py-2.5 hover:bg-surface">
                      <span className="block font-nav text-sm font-semibold">{c.name}</span>
                      <span className="block text-xs text-muted">{c.productCount} products</span>
                    </Link>
                  ))}
                </div>
                <Link to="/categories" className="mt-2 block rounded-lg border-t border-line px-3 pt-3 font-label text-sm font-semibold text-brand">Browse all categories</Link>
              </div>
            )}
          </div>
          <NavLink to="/deals" className={linkCls}>Deals</NavLink>
          <NavLink to="/about" className={linkCls}>About</NavLink>
        </nav>

        <SearchBar className="ml-auto hidden max-w-md flex-1 md:block" />

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link to="/wishlist" className="relative rounded-lg p-2.5 text-slate2 hover:bg-line/60" aria-label={`Wishlist, ${wishCount} items`}>
            <Heart size={20} /><CountBadge n={wishCount} />
          </Link>
          <Link to="/cart" className="relative rounded-lg p-2.5 text-slate2 hover:bg-line/60" aria-label={`Cart, ${itemCount} items`}>
            <ShoppingCart size={20} /><CountBadge n={itemCount} />
          </Link>
          {user ? (
            <div ref={menuRef} className="relative ml-1">
              <button onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-haspopup="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-label text-sm font-bold text-white" aria-label="Account menu">
                {user.fullName.trim().charAt(0).toUpperCase()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-3 w-60 rounded-xl border border-line bg-white py-2 shadow-lift">
                  <div className="border-b border-line px-4 pb-3 pt-1">
                    <p className="truncate font-nav text-sm font-bold">{user.fullName}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  {isAdmin && <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-surface"><LayoutDashboard size={16} />Admin dashboard</Link>}
                  <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-surface"><User size={16} />My profile</Link>
                  <Link to="/orders" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-surface"><Package size={16} />My orders</Link>
                  <button onClick={doLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-surface"><LogOut size={16} />Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <div className="ml-2 hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-ghost btn-sm">Sign in</Link>
              <Link to="/register" className="btn-primary btn-sm">Create account</Link>
            </div>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[84%] max-w-sm flex-col overflow-y-auto bg-white p-5 shadow-lift">
            <div className="mb-5 flex items-center justify-between">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 hover:bg-line/60" aria-label="Close menu"><X size={20} /></button>
            </div>
            <SearchBar onDone={() => setMobileOpen(false)} className="mb-5" />
            <nav className="flex flex-col" aria-label="Mobile">
              {[['/', 'Home'], ['/shop', 'Shop'], ['/categories', 'Categories'], ['/deals', 'Deals'], ['/about', 'About']].map(([to, label]) => (
                <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `rounded-lg px-3 py-3 font-nav text-base font-semibold ${isActive ? 'bg-brand-soft text-brand' : 'text-ink'}`}>{label}</NavLink>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 border-t border-line pt-5">
              {user ? (
                <>
                  {isAdmin && <Link to="/admin" className="btn-dark">Admin dashboard</Link>}
                  <Link to="/orders" className="btn-outline">My orders</Link>
                  <Link to="/profile" className="btn-outline">My profile</Link>
                  <button onClick={doLogout} className="btn-ghost text-danger">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline">Sign in</Link>
                  <Link to="/register" className="btn-primary">Create account</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
