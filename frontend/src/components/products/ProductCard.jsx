import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, GitCompareArrows, Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCompare } from '../../context/CompareContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatMoney } from '../../utils/format';
import ImageWithFallback from '../common/ImageWithFallback';
import RatingStars from '../common/RatingStars';
import QuickView from './QuickView';

function StockLabel({ p }) {
  if (!p.inStock) return <span className="badge bg-danger-soft text-danger">Out of stock</span>;
  if (p.lowStock) return <span className="badge bg-warning-soft text-amber-700">Only {p.stockQuantity} left</span>;
  return <span className="badge bg-success-soft text-success">In stock</span>;
}

export default function ProductCard({ product: p, layout = 'grid' }) {
  const { addToCart } = useCart();
  const { isWished, toggle } = useWishlist();
  const compare = useCompare();
  const [busy, setBusy] = useState(false);
  const [quick, setQuick] = useState(false);
  const wished = isWished(p.id);
  const comparing = compare.has(p.id);
  const list = layout === 'list';

  const add = async () => { setBusy(true); await addToCart(p.id, 1); setBusy(false); };

  return (
    <article className={`card group relative overflow-hidden transition-shadow hover:shadow-lift ${list ? 'flex' : 'flex flex-col'}`}>
      <div className={`relative bg-surface ${list ? 'w-40 shrink-0 sm:w-56' : 'aspect-square'}`}>
        <Link to={`/product/${p.id}`} tabIndex={-1} aria-hidden="true" className="block h-full">
          <ImageWithFallback src={p.imageUrl} alt={p.name} label={p.name} seed={p.categoryId}
            className={`h-full w-full object-cover ${list ? 'aspect-square' : ''}`} />
        </Link>
        {p.discountPercent > 0 && <span className="absolute left-3 top-3 rounded-md bg-danger px-2 py-1 font-label text-xs font-bold text-white">{p.discountPercent}% off</span>}
        <button onClick={() => toggle(p.id)} aria-pressed={wished} aria-label={wished ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-card transition-colors hover:text-danger">
          <Heart size={18} className={wished ? 'fill-danger text-danger' : ''} />
        </button>
        <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <button onClick={() => setQuick(true)} aria-label={`Quick view ${p.name}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-card hover:text-brand"><Eye size={17} /></button>
          <button onClick={() => compare.toggle(p)} aria-pressed={comparing} aria-label={comparing ? `Remove ${p.name} from comparison` : `Compare ${p.name}`}
            className={`flex h-9 w-9 items-center justify-center rounded-full shadow-card ${comparing ? 'bg-brand text-white' : 'bg-white hover:text-brand'}`}><GitCompareArrows size={17} /></button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="font-label text-xs font-semibold text-muted">{p.brand}</p>
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.5rem] font-heading text-[15px] font-bold leading-snug">
          <Link to={`/product/${p.id}`} className="hover:text-brand">{p.name}</Link>
        </h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          {p.ratingCount > 0 ? <RatingStars value={Number(p.ratingAvg)} count={p.ratingCount} /> : <span className="text-xs text-muted">No reviews yet</span>}
          <StockLabel p={p} />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-brand text-xl font-bold">{formatMoney(p.currentPrice)}</span>
          {p.discountPrice != null && <span className="text-sm text-muted line-through">{formatMoney(p.price)}</span>}
        </div>
        <button className="btn-primary mt-4 w-full" onClick={add} disabled={!p.inStock || busy}>
          <ShoppingCart size={16} aria-hidden="true" /> {p.inStock ? (busy ? 'Adding' : 'Add to cart') : 'Unavailable'}
        </button>
      </div>
      {quick && <QuickView productId={p.id} onClose={() => setQuick(false)} />}
    </article>
  );
}
