import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { productService } from '../../services/catalogService';
import { useAsync } from '../../hooks/useAsync';
import ProductGrid from './ProductGrid';

/** A titled section that loads one backend product collection (trending, best-sellers, ...). */
export default function ProductRow({ title, subtitle, type, limit = 4, to = '/shop', linkLabel = 'View all' }) {
  const { data, loading, error, reload } = useAsync(() => productService.collection(type, limit), [type, limit]);
  return (
    <section className="container-page py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        <Link to={to} className="inline-flex shrink-0 items-center gap-1 font-label text-sm font-semibold text-brand hover:text-brand-dark">{linkLabel} <ArrowRight size={15} /></Link>
      </div>
      <ProductGrid products={data} loading={loading} error={error} onRetry={reload} skeletons={limit} />
    </section>
  );
}
