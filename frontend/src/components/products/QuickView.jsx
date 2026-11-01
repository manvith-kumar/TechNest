import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/catalogService';
import { useCart } from '../../context/CartContext';
import { getErrorMessage } from '../../utils/errors';
import { formatMoney } from '../../utils/format';
import ImageWithFallback from '../common/ImageWithFallback';
import Modal from '../common/Modal';
import QuantitySelector from '../common/QuantitySelector';
import RatingStars from '../common/RatingStars';
import { Skeleton } from '../common/Skeletons';

export default function QuickView({ productId, onClose }) {
  const { addToCart } = useCart();
  const [p, setP] = useState(null);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    productService.get(productId).then(setP).catch((e) => setError(getErrorMessage(e)));
  }, [productId]);

  const add = async () => {
    setBusy(true);
    const ok = await addToCart(p.id, qty);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Modal open onClose={onClose} title={p?.name || 'Quick view'} size="lg">
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {!p && !error && <div className="grid gap-6 sm:grid-cols-2"><Skeleton className="aspect-square" /><div className="space-y-3"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-20" /></div></div>}
      {p && (
        <div className="grid gap-6 sm:grid-cols-2">
          <ImageWithFallback src={p.images[0]?.url} alt={p.name} label={p.name} seed={p.categoryId} className="aspect-square w-full rounded-xl bg-surface object-cover" />
          <div>
            <p className="font-label text-sm text-muted">{p.brand} · {p.categoryName}</p>
            <div className="mt-2"><RatingStars value={Number(p.ratingAvg)} count={p.ratingCount} /></div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-brand text-2xl font-bold">{formatMoney(p.currentPrice)}</span>
              {p.discountPrice != null && <><span className="text-sm text-muted line-through">{formatMoney(p.price)}</span><span className="badge bg-danger-soft text-danger">{p.discountPercent}% off</span></>}
            </div>
            <p className="mt-3 line-clamp-4 text-sm text-slate2">{p.description}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {p.specifications.slice(0, 3).map((s) => <li key={s.key}><span className="text-muted">{s.key}:</span> {s.value}</li>)}
            </ul>
            <div className="mt-5 flex items-center gap-3">
              <QuantitySelector value={qty} onChange={setQty} max={Math.min(10, p.stockQuantity || 1)} disabled={!p.inStock} />
              <button className="btn-primary flex-1" onClick={add} disabled={!p.inStock || busy}>{p.inStock ? 'Add to cart' : 'Out of stock'}</button>
            </div>
            <Link to={`/product/${p.id}`} onClick={onClose} className="mt-4 inline-block font-label text-sm font-semibold text-brand">View full details</Link>
          </div>
        </div>
      )}
    </Modal>
  );
}
