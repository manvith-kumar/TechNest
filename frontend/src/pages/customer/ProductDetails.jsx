import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { GitCompareArrows, Heart, RotateCcw, ShieldCheck, ShoppingCart, Truck, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { productService, reviewService } from '../../services/catalogService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useCompare } from '../../context/CompareContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { formatDate, formatMoney } from '../../utils/format';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import RatingStars, { RatingInput } from '../../components/common/RatingStars';
import QuantitySelector from '../../components/common/QuantitySelector';
import Pagination from '../../components/common/Pagination';
import EmptyState, { ErrorState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeletons';
import { useConfirm } from '../../components/common/ConfirmationModal';
import ProductGrid from '../../components/products/ProductGrid';

function ReviewForm({ productId, existing, onSaved, onCancel }) {
  const [rating, setRating] = useState(existing?.rating || 0);
  const [title, setTitle] = useState(existing?.title || '');
  const [comment, setComment] = useState(existing?.comment || '');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { setErrors({ rating: 'Choose a star rating.' }); return; }
    setBusy(true); setErrors({});
    try {
      const payload = { rating, title: title.trim() || null, comment: comment.trim() || null };
      if (existing) await reviewService.update(existing.id, payload); else await reviewService.create(productId, payload);
      toast.success(existing ? 'Review updated' : 'Thanks for your review');
      onSaved();
    } catch (err) { setErrors(getFieldErrors(err)); toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h3 className="font-heading text-lg font-bold">{existing ? 'Edit your review' : 'Write a review'}</h3>
      <div><RatingInput value={rating} onChange={setRating} />{errors.rating && <p className="field-error">{errors.rating}</p>}</div>
      <div><label className="label" htmlFor="rv-title">Headline (optional)</label><input id="rv-title" className="input" maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div><label className="label" htmlFor="rv-body">Your review (optional)</label><textarea id="rv-body" rows={4} maxLength={2000} className="input" value={comment} onChange={(e) => setComment(e.target.value)} /></div>
      <div className="flex gap-2"><button className="btn-primary" disabled={busy}>{busy ? 'Saving' : 'Submit review'}</button>{onCancel && <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>}</div>
    </form>
  );
}

function Reviews({ product }) {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(false);
  const summary = useAsync(() => reviewService.summary(product.id), [product.id]);
  const list = useAsync(() => reviewService.list(product.id, page, 5), [product.id, page]);
  const eligibility = useAsync(() => (user ? reviewService.eligibility(product.id) : Promise.resolve(null)), [product.id, user?.id]);
  const mine = list.data?.content.find((r) => r.userId === user?.id);

  const refreshAll = () => { setEditing(false); summary.reload(); list.reload(); eligibility.reload(); };
  const remove = async (r) => {
    if (!(await confirm({ title: 'Delete your review?', message: 'This cannot be undone.', confirmLabel: 'Delete review' }))) return;
    try { await reviewService.remove(r.id); toast.success('Review deleted'); refreshAll(); } catch (err) { toast.error(getErrorMessage(err)); }
  };
  const report = async (r) => { try { toast.success((await reviewService.report(r.id)).message); } catch (err) { toast.error(getErrorMessage(err)); } };

  const s = summary.data;
  return (
    <section className="mt-14" aria-labelledby="reviews-h">
      <h2 id="reviews-h" className="section-title mb-6">Customer reviews</h2>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="card h-fit p-5">
          {!s ? <Skeleton className="h-32" /> : (
            <>
              <p className="font-brand text-4xl font-bold">{s.average ? s.average.toFixed(1) : '–'}</p>
              <div className="mt-1"><RatingStars value={s.average} size={16} /></div>
              <p className="mt-1 text-sm text-muted">{s.count} review{s.count === 1 ? '' : 's'}</p>
              <div className="mt-4 space-y-1.5">
                {[5, 4, 3, 2, 1].map((n) => (
                  <div key={n} className="flex items-center gap-2 font-label text-xs">
                    <span className="w-3">{n}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-warning" style={{ width: `${s.count ? ((s.distribution[n] || 0) / s.count) * 100 : 0}%` }} /></div>
                    <span className="w-6 text-right text-muted">{s.distribution[n] || 0}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="space-y-5">
          {!user && <p className="card p-4 text-sm text-slate2"><Link to="/login" state={{ from: `/product/${product.id}` }} className="font-semibold text-brand">Sign in</Link> to review products you've received.</p>}
          {user && eligibility.data?.canReview && !editing && <ReviewForm productId={product.id} onSaved={refreshAll} />}
          {user && eligibility.data && !eligibility.data.canReview && !eligibility.data.hasReview && <p className="card p-4 text-sm text-slate2">{eligibility.data.reason}</p>}
          {editing && mine && <ReviewForm productId={product.id} existing={mine} onSaved={refreshAll} onCancel={() => setEditing(false)} />}

          {list.loading && <Skeleton className="h-28" />}
          {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
          {list.data && !list.data.content.length && <EmptyState title="No reviews yet" message="Be the first to share how this product works for you." />}
          {list.data?.content.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div><RatingStars value={r.rating} /><h3 className="mt-1.5 font-heading font-bold">{r.title || 'Review'}</h3></div>
                <p className="shrink-0 text-xs text-muted">{formatDate(r.createdAt)}</p>
              </div>
              {r.comment && <p className="mt-2 whitespace-pre-line text-sm text-slate2">{r.comment}</p>}
              <div className="mt-3 flex items-center gap-4 text-xs">
                <span className="font-label font-semibold text-muted">{r.userName}</span>
                {r.userId === user?.id ? (
                  <>
                    <button className="font-semibold text-brand" onClick={() => setEditing(true)}>Edit</button>
                    <button className="font-semibold text-danger" onClick={() => remove(r)}>Delete</button>
                  </>
                ) : user && <button className="text-muted hover:text-danger" onClick={() => report(r)}>Report</button>}
              </div>
            </article>
          ))}
          <Pagination page={list.data?.page ?? 0} totalPages={list.data?.totalPages} onChange={setPage} />
        </div>
      </div>
    </section>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWished, toggle } = useWishlist();
  const compare = useCompare();
  const { data: p, loading, error, reload } = useAsync(() => productService.get(id), [id]);
  const related = useAsync(() => productService.related(id, 4), [id]);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(p?.name);
  useEffect(() => { setActive(0); setQty(1); window.scrollTo(0, 0); }, [id]);

  if (loading) return <div className="container-page grid gap-10 py-10 md:grid-cols-2"><Skeleton className="aspect-square" /><div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-5 w-1/3" /><Skeleton className="h-24" /></div></div>;
  if (error) return <div className="container-page py-10"><ErrorState message={error.includes('not found') ? 'This product is not available any more.' : error} onRetry={reload} /></div>;

  const maxQty = Math.max(1, Math.min(10, p.stockQuantity));
  const add = async () => { setBusy(true); await addToCart(p.id, qty); setBusy(false); };
  const buyNow = async () => {
    setBusy(true);
    const cart = await addToCart(p.id, qty, null);
    setBusy(false);
    const line = cart && cart.items?.find((i) => i.productId === p.id);
    if (line) navigate('/checkout', { state: { cartItemIds: [line.id] } });
  };

  return (
    <div className="container-page py-8">
      <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-ink">Home</Link> / <Link to="/shop" className="hover:text-ink">Shop</Link> / <Link to={`/shop?categoryId=${p.categoryId}`} className="hover:text-ink">{p.categoryName}</Link> / <span className="text-ink">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <ImageWithFallback src={p.images[active]?.url} alt={p.images[active]?.altText || p.name} label={p.name} seed={p.categoryId} className="aspect-square w-full object-cover" />
          </div>
          {p.images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto">
              {p.images.map((img, i) => (
                <button key={i} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`} aria-current={i === active}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${i === active ? 'border-brand' : 'border-line'}`}>
                  <ImageWithFallback src={img.url} alt="" label={p.name} seed={p.categoryId} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="font-label text-sm font-semibold text-brand">{p.brand}</p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold leading-tight">{p.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <RatingStars value={Number(p.ratingAvg)} count={p.ratingCount} size={17} showValue />
            {!p.inStock ? <span className="badge bg-danger-soft text-danger">Out of stock</span>
              : p.lowStock ? <span className="badge bg-warning-soft text-amber-700">Only {p.stockQuantity} left</span>
              : <span className="badge bg-success-soft text-success">In stock</span>}
          </div>
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="font-brand text-4xl font-bold">{formatMoney(p.currentPrice)}</span>
            {p.discountPrice != null && <><span className="text-lg text-muted line-through">{formatMoney(p.price)}</span><span className="badge bg-danger-soft text-danger">Save {p.discountPercent}%</span></>}
          </div>
          <p className="mt-1 text-xs text-muted">Inclusive of all taxes.</p>
          <p className="mt-5 leading-relaxed text-slate2">{p.description}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <QuantitySelector value={qty} onChange={setQty} max={maxQty} disabled={!p.inStock} />
            <button className="btn-primary btn-lg flex-1" onClick={add} disabled={!p.inStock || busy}><ShoppingCart size={18} /> Add to cart</button>
            <button className="btn-dark btn-lg flex-1" onClick={buyNow} disabled={!p.inStock || busy}><Zap size={18} /> Buy now</button>
          </div>
          <div className="mt-3 flex gap-3">
            <button className="btn-outline flex-1" onClick={() => toggle(p.id)} aria-pressed={isWished(p.id)}><Heart size={16} className={isWished(p.id) ? 'fill-danger text-danger' : ''} /> {isWished(p.id) ? 'Saved to wishlist' : 'Add to wishlist'}</button>
            <button className="btn-outline flex-1" onClick={() => compare.toggle({ ...p, imageUrl: p.images[0]?.url })} aria-pressed={compare.has(p.id)}><GitCompareArrows size={16} /> {compare.has(p.id) ? 'In comparison' : 'Compare'}</button>
          </div>

          <ul className="card mt-7 divide-y divide-line text-sm">
            <li className="flex gap-3 p-4"><Truck size={20} className="shrink-0 text-brand" /><span><b className="font-semibold">Delivery</b><br /><span className="text-muted">{p.currentPrice >= 5000 ? 'Free delivery on this order.' : 'Free delivery on orders above ₹5,000, otherwise ₹99.'} Usually arrives in 3–5 working days.</span></span></li>
            <li className="flex gap-3 p-4"><RotateCcw size={20} className="shrink-0 text-brand" /><span><b className="font-semibold">7-day replacement</b><br /><span className="text-muted">If the product arrives damaged or defective.</span></span></li>
            <li className="flex gap-3 p-4"><ShieldCheck size={20} className="shrink-0 text-brand" /><span><b className="font-semibold">Manufacturer warranty</b><br /><span className="text-muted">Covered as per the brand's standard terms.</span></span></li>
          </ul>
        </div>
      </div>

      {p.specifications.length > 0 && (
        <section className="mt-14" aria-labelledby="specs-h">
          <h2 id="specs-h" className="section-title mb-5">Specifications</h2>
          <dl className="card divide-y divide-line">
            {p.specifications.map((s) => (
              <div key={s.key} className="grid gap-1 px-5 py-3.5 text-sm sm:grid-cols-[220px_1fr]"><dt className="font-label font-semibold text-muted">{s.key}</dt><dd>{s.value}</dd></div>
            ))}
          </dl>
        </section>
      )}

      <Reviews product={p} />

      <section className="mt-14" aria-labelledby="rel-h">
        <h2 id="rel-h" className="section-title mb-5">You may also like</h2>
        <ProductGrid products={related.data} loading={related.loading} error={related.error} skeletons={4} cols="md:grid-cols-4" />
      </section>
    </div>
  );
}
