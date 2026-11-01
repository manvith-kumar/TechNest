import { SearchX } from 'lucide-react';
import EmptyState, { ErrorState } from '../common/EmptyState';
import { ProductGridSkeleton } from '../common/Skeletons';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, loading, error, onRetry, layout = 'grid', skeletons = 8, empty, cols = 'md:grid-cols-3 xl:grid-cols-4' }) {
  if (loading) return <ProductGridSkeleton count={skeletons} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!products?.length) return empty || <EmptyState icon={SearchX} title="No products found" message="Try changing or clearing your filters." />;
  return layout === 'list' ? (
    <div className="space-y-4">{products.map((p) => <ProductCard key={p.id} product={p} layout="list" />)}</div>
  ) : (
    <div className={`grid grid-cols-2 gap-4 ${cols}`}>{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
  );
}
