import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GitCompareArrows, X } from 'lucide-react';
import { productService } from '../../services/catalogService';
import { useCart } from '../../context/CartContext';
import { useCompare } from '../../context/CompareContext';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatMoney } from '../../utils/format';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import RatingStars from '../../components/common/RatingStars';
import EmptyState, { ErrorState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeletons';

export default function Compare() {
  useDocumentTitle('Compare products');
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const compare = useCompare();
  const ids = (params.get('ids') || '').split(',').filter(Boolean).map(Number).filter(Number.isFinite);
  const { data, loading, error, reload } = useAsync(() => (ids.length >= 2 ? productService.compare(ids) : Promise.resolve(null)), [ids.join(',')]);

  const drop = (id) => {
    compare.remove(id);
    const next = ids.filter((x) => x !== id);
    if (next.length < 2) navigate('/shop'); else setParams({ ids: next.join(',') });
  };

  if (ids.length < 2) return <div className="container-page py-10"><EmptyState icon={GitCompareArrows} title="Pick products to compare" message="Use the compare button on any product card. You can compare up to 4 products from the same category." action={<Link to="/shop" className="btn-primary">Browse products</Link>} /></div>;
  if (loading) return <div className="container-page py-10"><Skeleton className="h-96" /></div>;
  if (error) return <div className="container-page py-10"><ErrorState message={error} onRetry={reload} /></div>;

  const rows = [
    ['Price', (p) => <span className="font-brand text-lg font-bold">{formatMoney(p.currentPrice)}{p.discountPrice != null && <span className="ml-2 text-xs font-normal text-muted line-through">{formatMoney(p.price)}</span>}</span>],
    ['Rating', (p) => (p.ratingCount ? <RatingStars value={Number(p.ratingAvg)} count={p.ratingCount} showValue /> : <span className="text-muted">No reviews</span>)],
    ['Availability', (p) => (p.inStock ? <span className="text-success">In stock{p.lowStock ? ` (${p.stockQuantity} left)` : ''}</span> : <span className="text-danger">Out of stock</span>)],
    ...data.specKeys.map((k) => [k, (p) => p.specifications.find((s) => s.key === k)?.value || <span className="text-muted">–</span>]),
  ];

  return (
    <div className="container-page py-8">
      <h1 className="font-heading text-3xl font-extrabold">Compare products</h1>
      <p className="mt-1 text-sm text-muted">{data.products[0].categoryName} · differences are easiest to spot row by row.</p>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="align-top">
              <th scope="col" className="w-40 bg-surface p-4"><span className="sr-only">Feature</span></th>
              {data.products.map((p) => (
                <th key={p.id} scope="col" className="relative w-[26%] min-w-[180px] border-l border-line p-4 font-normal">
                  <button onClick={() => drop(p.id)} className="absolute right-2 top-2 rounded-full p-1 text-muted hover:bg-line/60" aria-label={`Remove ${p.name}`}><X size={15} /></button>
                  <Link to={`/product/${p.id}`}><ImageWithFallback src={p.images[0]?.url} alt={p.name} label={p.name} seed={p.categoryId} className="mb-3 aspect-square w-full rounded-lg object-cover" /></Link>
                  <p className="font-label text-xs text-muted">{p.brand}</p>
                  <Link to={`/product/${p.id}`} className="font-heading font-bold hover:text-brand">{p.name}</Link>
                  <button className="btn-primary btn-sm mt-3 w-full" disabled={!p.inStock} onClick={() => addToCart(p.id, 1)}>Add to cart</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(([label, render]) => (
              <tr key={label}>
                <th scope="row" className="bg-surface p-4 font-label font-semibold text-muted">{label}</th>
                {data.products.map((p) => <td key={p.id} className="border-l border-line p-4">{render(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
