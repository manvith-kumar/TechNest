import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Banknote, Check, CreditCard, MapPin, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { addressService, orderService } from '../../services/shopService';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../utils/errors';
import { formatMoney } from '../../utils/format';
import AddressForm from '../../components/checkout/AddressForm';
import OrderSummary, { computeTotals } from '../../components/cart/OrderSummary';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';

const STEPS = ['Cart', 'Address', 'Payment', 'Review', 'Confirm'];

export default function Checkout() {
  useDocumentTitle('Checkout');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const addresses = useAsync(() => addressService.list(), []);
  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [method, setMethod] = useState('COD');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [formError, setFormError] = useState(null);
  const idempotencyKey = useRef(crypto.randomUUID());   // the same key is reused on retries so a double-submit cannot create two orders
  const lockRef = useRef(false);

  const selectedIds = location.state?.cartItemIds;
  const items = useMemo(() => (cart?.items || []).filter((i) => !selectedIds || selectedIds.includes(i.id)), [cart, selectedIds]);
  const totals = cart ? computeTotals(items, cart) : null;
  const blocked = items.length === 0 || items.some((i) => !i.available);

  useEffect(() => {
    if (addresses.data && addressId == null) {
      const def = addresses.data.find((a) => a.defaultAddress) || addresses.data[0];
      if (def) setAddressId(def.id);
    }
  }, [addresses.data, addressId]);

  if (!cart) return <div className="container-page py-16"><div className="flex justify-center text-brand"><Spinner size={30} /></div></div>;
  if (!items.length) return <div className="container-page py-10"><EmptyState title="Nothing to check out" message="Your cart is empty." action={<Link to="/shop" className="btn-primary">Browse products</Link>} /></div>;

  const address = addresses.data?.find((a) => a.id === addressId);
  const canNext = [!blocked, !!address, true, true, true][step];

  const place = async () => {
    if (lockRef.current) return;            // blocks double-clicks before React re-renders
    lockRef.current = true; setPlacing(true); setFormError(null);
    try {
      const order = await orderService.place({
        addressId, paymentMethod: method, idempotencyKey: idempotencyKey.current,
        cartItemIds: selectedIds || null, simulatePaymentFailure: method === 'DEMO_ONLINE' && simulateFailure,
      });
      await refresh();
      toast.success('Order placed successfully');
      navigate(`/order-confirmation/${order.id}`, { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err));
      toast.error(getErrorMessage(err));
      refresh();
      lockRef.current = false; setPlacing(false);
    }
  };

  const Option = ({ active, onClick, icon: Icon, title, text }) => (
    <button type="button" onClick={onClick} aria-pressed={active} className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${active ? 'border-brand bg-brand-soft/50' : 'border-line hover:border-slate-300'}`}>
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-brand text-white' : 'bg-surface text-slate2'}`}><Icon size={18} /></span>
      <span><span className="block font-nav text-sm font-bold">{title}</span><span className="block text-sm text-muted">{text}</span></span>
    </button>
  );

  return (
    <div className="container-page py-8">
      <h1 className="font-heading text-3xl font-extrabold">Checkout</h1>
      <ol className="mt-6 flex items-center gap-2 overflow-x-auto pb-2" aria-label="Checkout steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex shrink-0 items-center gap-2" aria-current={i === step ? 'step' : undefined}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full font-label text-xs font-bold ${i < step ? 'bg-success text-white' : i === step ? 'bg-brand text-white' : 'bg-line text-muted'}`}>{i < step ? <Check size={14} /> : i + 1}</span>
            <span className={`font-nav text-sm font-semibold ${i === step ? 'text-ink' : 'text-muted'}`}>{s}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-line sm:w-10" />}
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="card p-6" aria-live="polite">
          {step === 0 && (
            <>
              <h2 className="font-heading text-xl font-bold">Review your items</h2>
              {blocked && <p role="alert" className="mt-3 rounded-lg bg-warning-soft p-3 text-sm text-amber-800">Some items are unavailable in the selected quantity. <Link to="/cart" className="font-semibold underline">Update your cart</Link>.</p>}
              <ul className="mt-4 divide-y divide-line">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center gap-4 py-3">
                    <ImageWithFallback src={i.imageUrl} alt="" label={i.name} className="h-16 w-16 rounded-lg bg-surface object-cover" />
                    <div className="min-w-0 flex-1"><p className="truncate font-heading font-bold">{i.name}</p><p className="text-sm text-muted">Qty {i.quantity} × {formatMoney(i.unitPrice)}</p></div>
                    <p className="font-brand font-bold">{formatMoney(i.lineTotal, true)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-heading text-xl font-bold">Delivery address</h2>
              {addresses.loading ? <Spinner className="mt-4 text-brand" /> : (
                <div className="mt-4 space-y-3">
                  {(addresses.data || []).map((a) => (
                    <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${addressId === a.id ? 'border-brand bg-brand-soft/50' : 'border-line'}`}>
                      <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 accent-brand" />
                      <span className="text-sm"><span className="block font-nav font-bold">{a.recipientName} <span className="badge ml-1 bg-line text-slate2">{a.label}</span></span>
                        {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.postalCode}<br /><span className="text-muted">{a.phone}</span></span>
                    </label>
                  ))}
                  {adding ? (
                    <div className="rounded-xl border border-line p-4"><AddressForm defaultName={user.fullName} onCancel={() => setAdding(false)} onSaved={(a) => { setAdding(false); setAddressId(a.id); addresses.reload(); }} /></div>
                  ) : <button className="btn-outline" onClick={() => setAdding(true)}><Plus size={16} /> Add a new address</button>}
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-heading text-xl font-bold">Payment method</h2>
              <div className="mt-4 space-y-3">
                <Option active={method === 'COD'} onClick={() => setMethod('COD')} icon={Banknote} title="Cash on delivery" text="Pay in cash when your order arrives." />
                <Option active={method === 'DEMO_ONLINE'} onClick={() => setMethod('DEMO_ONLINE')} icon={CreditCard} title="Demo online payment" text="A simulated payment for demonstration. No card details are collected and no money moves." />
              </div>
              {method === 'DEMO_ONLINE' && (
                <div className="mt-4 rounded-xl border border-dashed border-violet2 bg-violet2-soft p-4 text-sm">
                  <p className="font-semibold text-violet2">This is a simulation</p>
                  <p className="mt-1 text-slate2">Your order will be marked as paid immediately. Nothing is charged.</p>
                  <label className="mt-3 flex items-center gap-2"><input type="checkbox" checked={simulateFailure} onChange={(e) => setSimulateFailure(e.target.checked)} className="accent-violet2" /> Simulate a declined payment (to test the failure path)</label>
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-heading text-xl font-bold">Review your order</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-surface p-4 text-sm"><p className="mb-1 flex items-center gap-1.5 font-nav font-bold"><MapPin size={15} /> Delivering to</p>{address.recipientName}<br />{address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />{address.city}, {address.state} {address.postalCode}</div>
                <div className="rounded-xl bg-surface p-4 text-sm"><p className="mb-1 font-nav font-bold">Payment</p>{method === 'COD' ? 'Cash on delivery' : 'Demo online payment (simulated)'}</div>
              </div>
              <ul className="mt-4 divide-y divide-line text-sm">{items.map((i) => <li key={i.id} className="flex justify-between py-2.5"><span>{i.name} × {i.quantity}</span><span className="font-medium">{formatMoney(i.lineTotal, true)}</span></li>)}</ul>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-heading text-xl font-bold">Confirm your purchase</h2>
              <p className="mt-2 text-sm text-slate2">You are about to place an order for <b>{formatMoney(totals.total, true)}</b> using <b>{method === 'COD' ? 'cash on delivery' : 'a simulated online payment'}</b>. Final prices and stock are checked again when you confirm.</p>
              {formError && <p role="alert" className="mt-4 rounded-lg bg-danger-soft p-3 text-sm text-danger">{formError}</p>}
              <button className="btn-primary btn-lg mt-6 w-full sm:w-auto" onClick={place} disabled={placing}>{placing ? <><Spinner size={16} /> Placing order</> : 'Place order'}</button>
            </>
          )}

          <div className="mt-8 flex justify-between border-t border-line pt-5">
            <button className="btn-ghost" disabled={step === 0 || placing} onClick={() => setStep(step - 1)}>Back</button>
            {step < 4 && <button className="btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>{step === 3 ? 'Continue to confirm' : 'Continue'}</button>}
          </div>
        </section>

        <aside className="h-fit lg:sticky lg:top-24"><OrderSummary totals={totals} threshold={cart.freeShippingThreshold} /></aside>
      </div>
    </div>
  );
}
