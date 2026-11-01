import { Link } from 'react-router-dom';
import { Mail, ShieldCheck, Truck } from 'lucide-react';
import Logo from './Logo';

const col = 'space-y-2.5 text-sm text-slate-300';
const lnk = 'hover:text-white';

export default function Footer() {
  return (
    <footer className="mt-20 bg-navy text-slate-300">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">Discover. Explore. Shop. Phones, laptops, audio and gaming gear from brands you know.</p>
          <p className="mt-5 flex items-center gap-2 text-sm"><Mail size={15} /> support@technest.example</p>
        </div>
        <div>
          <h3 className="mb-4 font-nav text-sm font-bold text-white">Shop</h3>
          <ul className={col}>
            <li><Link className={lnk} to="/shop">All products</Link></li>
            <li><Link className={lnk} to="/categories">Categories</Link></li>
            <li><Link className={lnk} to="/deals">Deals</Link></li>
            <li><Link className={lnk} to="/compare">Compare products</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-nav text-sm font-bold text-white">Your account</h3>
          <ul className={col}>
            <li><Link className={lnk} to="/profile">Profile and addresses</Link></li>
            <li><Link className={lnk} to="/orders">Orders and tracking</Link></li>
            <li><Link className={lnk} to="/wishlist">Wishlist</Link></li>
            <li><Link className={lnk} to="/cart">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-nav text-sm font-bold text-white">Good to know</h3>
          <ul className={col}>
            <li className="flex gap-2"><Truck size={16} className="mt-0.5 shrink-0" /> Free delivery on orders above ₹5,000</li>
            <li className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0" /> 7-day replacement on eligible items</li>
            <li><Link className={lnk} to="/about">About TechNest</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-1 py-5 text-xs text-slate-400 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} TechNest. Demonstration storefront.</p>
          <p>Catalogue data, prices and reviews are sample content. Online payments are simulated.</p>
        </div>
      </div>
    </footer>
  );
}
