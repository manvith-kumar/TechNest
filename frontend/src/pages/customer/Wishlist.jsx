import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatMoney } from '../../utils/format';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import EmptyState from '../../components/common/EmptyState';
import { ProductGridSkeleton } from '../../components/common/Skeletons';

export default function Wishlist() {
  useDocumentTitle('Wishlist');
  const { items, loading, remove } = useWishlist();
  const { addToCart } = useCart();

  const moveToCart = async (p) => {
    if (await addToCart(p.id, 1, null)) { await remove(p.id); toast.success(`${p.name} moved to your cart`); }
  };

  return (
    <div className="container-page py-8">
      <h1 className="font-heading text-3xl font-extrabold">Your wishlist</h1>
      <div className="mt-6">
        {loading ? <ProductGridSkeleton count={4} /> : !items.length ? (
          <EmptyState icon={Heart} title="Nothing saved yet" message="Tap the heart on any product to keep it here for later." action={<Link to="/shop" className="btn-primary">Browse products</Link>} />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {items.map(({ product: p }) => (
              <article key={p.id} className="card flex flex-col overflow-hidden">
                <Link to={`/product/${p.id}`}><ImageWithFallback src={p.imageUrl} alt={p.name} label={p.name} seed={p.categoryId} className="aspect-square w-full bg-surface object-cover" /></Link>
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-label text-xs text-muted">{p.brand}</p>
                  <Link to={`/product/${p.id}`} className="line-clamp-2 min-h-[2.5rem] font-heading text-[15px] font-bold hover:text-brand">{p.name}</Link>
                  <p className="mt-2 font-brand text-lg font-bold">{formatMoney(p.currentPrice)}</p>
                  {!p.inStock && <p className="text-xs font-semibold text-danger">Out of stock</p>}
                  <div className="mt-4 flex gap-2">
                    <button className="btn-primary flex-1" disabled={!p.inStock} onClick={() => moveToCart(p)}><ShoppingCart size={15} /> Move to cart</button>
                    <button className="btn-outline px-3" onClick={() => remove(p.id)} aria-label={`Remove ${p.name} from wishlist`}><Trash2 size={16} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
