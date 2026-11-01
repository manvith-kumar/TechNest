import { Link } from 'react-router-dom';
import { Compass, HeartHandshake, PackageCheck, ShieldCheck } from 'lucide-react';
import { categoryService } from '../../services/catalogService';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import EmptyState, { ErrorState } from '../../components/common/EmptyState';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import { Skeleton } from '../../components/common/Skeletons';

export function About() {
  useDocumentTitle('About');
  const values = [
    [PackageCheck, 'Honest availability', 'Stock levels you see are the stock levels we have. Orders are checked against live inventory.'],
    [ShieldCheck, 'Transparent pricing', 'Prices include taxes. Delivery is free above ₹5,000 and a flat ₹99 below it, shown before you pay.'],
    [HeartHandshake, 'Easy returns', 'A 7-day replacement window on eligible items that arrive damaged or defective.'],
    [Compass, 'Made for choosing', 'Filters, side-by-side comparison and verified-purchase reviews help you pick the right device.'],
  ];
  return (
    <div className="container-page max-w-4xl py-12">
      <h1 className="font-brand text-4xl font-bold">About TechNest</h1>
      <p className="mt-4 text-lg leading-relaxed text-slate2">TechNest is an online electronics store for smartphones, laptops, tablets, audio, wearables, gaming gear and accessories. We keep the catalogue focused, the information accurate and checkout simple.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {values.map(([Icon, t, d]) => <div key={t} className="card p-6"><Icon className="text-brand" /><h2 className="mt-3 font-heading text-lg font-bold">{t}</h2><p className="mt-1 text-sm text-muted">{d}</p></div>)}
      </div>
      <p className="mt-10 rounded-xl bg-violet2-soft p-5 text-sm text-slate2"><b>About this demo:</b> TechNest is a demonstration project. Catalogue entries, prices, stock and reviews are sample data, and online payments are simulated: no real transactions take place.</p>
    </div>
  );
}

export function Categories() {
  useDocumentTitle('Categories');
  const { data, loading, error, reload } = useAsync(() => categoryService.list(), []);
  return (
    <div className="container-page py-10">
      <h1 className="font-heading text-3xl font-extrabold">All categories</h1>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        {error && <div className="col-span-full"><ErrorState message={error} onRetry={reload} /></div>}
        {data?.map((c) => (
          <Link key={c.id} to={`/shop?categoryId=${c.id}`} className="card group overflow-hidden transition-shadow hover:shadow-lift">
            <ImageWithFallback src={c.imageUrl} alt="" label={c.name} seed={c.id} className="aspect-[4/3] w-full bg-surface object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
            <div className="p-4"><h2 className="font-heading font-bold">{c.name}</h2><p className="mt-0.5 line-clamp-2 text-sm text-muted">{c.description}</p><p className="mt-2 font-label text-xs font-semibold text-brand">{c.productCount} products</p></div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function NotFound() {
  useDocumentTitle('Page not found');
  return <div className="container-page py-10"><EmptyState title="We couldn't find that page" message="The link may be broken or the page may have moved." action={<Link to="/" className="btn-primary">Go to the homepage</Link>} /></div>;
}
