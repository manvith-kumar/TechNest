import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useConfirm } from '../../components/common/ConfirmationModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatMoney } from '../../utils/format';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import QuantitySelector from '../../components/common/QuantitySelector';
import EmptyState from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeletons';
import OrderSummary, { computeTotals } from '../../components/cart/OrderSummary';

export default function Cart() {
  useDocumentTitle('Your cart');
  const { cart, loading, updateQuantity, removeItem } = useCart();
  const confirm = useConfirm();
  const navigate = useNavigate();

  if (loading && !cart) return <div className="container-page py-10"><Skeleton className="h-64" /></div>;
  if (!cart || !cart.items.length) {
    return <div className="container-page py-10"><EmptyState icon={ShoppingBag} title="Your cart is empty" message="Add a few products and they will wait for you here." action={<Link to="/shop" className="btn-primary">Start shopping</Link>} /></div>;
  }
  const totals = computeTotals(cart.items, cart);
  const remove = async (i) => { if (await confirm({ title: 'Remove this item?', message: `${i.name} will be removed from your cart.`, confirmLabel: 'Remove' })) removeItem(i.id); };

  return (
    <div className="container-page py-8">
      <h1 className="font-heading text-3xl font-extrabold">Your cart <span className="text-lg font-semibold text-muted">({cart.itemCount} items)</span></h1>
      {cart.checkoutBlocked && <p role="alert" className="mt-4 rounded-lg bg-warning-soft p-3 text-sm text-amber-800">Some items are no longer available in the quantity you selected. Update or remove them to continue.</p>}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {cart.items.map((i) => (
            <li key={i.id} className={`card flex gap-4 p-4 ${i.available ? '' : 'border-warning'}`}>
              <Link to={`/product/${i.productId}`} className="shrink-0"><ImageWithFallback src={i.imageUrl} alt={i.name} label={i.name} className="h-24 w-24 rounded-lg bg-surface object-cover sm:h-28 sm:w-28" /></Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="font-label text-xs text-muted">{i.brand}</p>
                <Link to={`/product/${i.productId}`} className="font-heading font-bold leading-snug hover:text-brand">{i.name}</Link>
                <p className="mt-1 text-sm text-muted">{formatMoney(i.unitPrice)} each{i.originalPrice > i.unitPrice && <span className="ml-2 line-through">{formatMoney(i.originalPrice)}</span>}</p>
                {!i.available && <p className="mt-1 text-xs font-semibold text-amber-700">{i.stockQuantity === 0 ? 'Out of stock' : `Only ${i.stockQuantity} available`}</p>}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <QuantitySelector size="sm" value={i.quantity} max={Math.max(1, Math.min(10, i.stockQuantity))} onChange={(q) => updateQuantity(i.id, q)} />
                  <p className="font-brand text-lg font-bold">{formatMoney(i.lineTotal, true)}</p>
                  <button onClick={() => remove(i)} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-danger" aria-label={`Remove ${i.name}`}><Trash2 size={15} /> Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit lg:sticky lg:top-24">
          <OrderSummary totals={totals} threshold={cart.freeShippingThreshold}>
            <button className="btn-primary btn-lg mt-5 w-full" disabled={cart.checkoutBlocked} onClick={() => navigate('/checkout')}>Proceed to checkout</button>
            <Link to="/shop" className="mt-3 block text-center font-label text-sm font-semibold text-brand">Continue shopping</Link>
          </OrderSummary>
        </aside>
      </div>
    </div>
  );
}
