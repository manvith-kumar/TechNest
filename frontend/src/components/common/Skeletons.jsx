export const Skeleton = ({ className = '' }) => <div className={`skeleton ${className}`} aria-hidden="true" />;

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-6 w-2/5" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4" role="status" aria-label="Loading products">
    {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
  </div>
);

export const TableSkeleton = ({ rows = 6, cols = 5 }) => (
  <div className="divide-y divide-line" role="status" aria-label="Loading">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4 px-4 py-4">
        {Array.from({ length: cols }).map((__, c) => <Skeleton key={c} className="h-4 flex-1" />)}
      </div>
    ))}
  </div>
);
