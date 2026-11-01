import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgePercent, Headphones, Laptop, Mail, ShieldCheck, Smartphone, Tablet, Truck, Watch, Gamepad2, Monitor, Plug, RotateCcw, Quote } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoryService, newsletterService, productService } from '../../services/catalogService';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../utils/errors';
import { formatMoney } from '../../utils/format';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import { Skeleton } from '../../components/common/Skeletons';
import ProductRow from '../../components/products/ProductRow';

const CATEGORY_ICONS = { Smartphones: Smartphone, Laptops: Laptop, Tablets: Tablet, Audio: Headphones, Wearables: Watch, Gaming: Gamepad2, Accessories: Plug, Monitors: Monitor };

function Hero() {
  const { data, loading } = useAsync(() => productService.collection('featured', 3), []);
  const [main, second, third] = data || [];
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute -right-24 top-0 h-[480px] w-[480px] rounded-full bg-brand/25 blur-3xl" aria-hidden="true" />
      <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-label text-xs font-medium text-slate-200">
            <BadgePercent size={14} className="text-brand" aria-hidden="true" /> Fresh deals on top brands, updated daily
          </p>
          <h1 className="font-brand text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-[56px]">Upgrade your world with smarter technology.</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-300">Explore the latest gadgets, discover innovative technology and find everything you need in one place.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="btn-primary btn-lg">Shop now <ArrowRight size={18} /></Link>
            <Link to="/categories" className="btn btn-lg border border-white/25 text-white hover:bg-white/10">Explore categories</Link>
          </div>
          <ul className="mt-10 grid max-w-lg gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <li className="flex items-center gap-2"><Truck size={17} className="text-brand" /> Free delivery over ₹5,000</li>
            <li className="flex items-center gap-2"><RotateCcw size={17} className="text-brand" /> 7-day replacement</li>
            <li className="flex items-center gap-2"><ShieldCheck size={17} className="text-brand" /> Secure checkout</li>
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-label="Featured products">
          {loading && <Skeleton className="aspect-[4/3] w-full bg-white/10" />}
          {!loading && main && (
            <div className="relative">
              <Link to={`/product/${main.id}`} className="block overflow-hidden rounded-2xl bg-white text-ink shadow-lift">
                <ImageWithFallback src={main.imageUrl} alt={main.name} label={main.name} seed={main.categoryId} className="aspect-[4/3] w-full object-cover" />
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0"><p className="font-label text-xs text-muted">{main.brand}</p><p className="truncate font-heading font-bold">{main.name}</p></div>
                  <p className="shrink-0 font-brand text-lg font-bold">{formatMoney(main.currentPrice)}</p>
                </div>
              </Link>
              {second && (
                <Link to={`/product/${second.id}`} className="absolute -bottom-6 -left-4 hidden w-48 overflow-hidden rounded-xl bg-white text-ink shadow-lift sm:block">
                  <ImageWithFallback src={second.imageUrl} alt={second.name} label={second.name} seed={second.categoryId} className="aspect-[3/2] w-full object-cover" />
                  <p className="truncate px-3 pt-2 font-label text-xs font-semibold">{second.name}</p>
                  <p className="px-3 pb-2 font-brand text-sm font-bold">{formatMoney(second.currentPrice)}</p>
                </Link>
              )}
              {third && (
                <Link to={`/product/${third.id}`} className="absolute -right-3 -top-6 hidden w-40 overflow-hidden rounded-xl bg-white text-ink shadow-lift sm:block">
                  <ImageWithFallback src={third.imageUrl} alt={third.name} label={third.name} seed={third.categoryId} className="aspect-[3/2] w-full object-cover" />
                  <p className="truncate px-3 pt-2 font-label text-xs font-semibold">{third.name}</p>
                  <p className="px-3 pb-2 font-brand text-sm font-bold">{formatMoney(third.currentPrice)}</p>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const { data, loading } = useAsync(() => categoryService.list(), []);
  return (
    <section className="container-page py-12">
      <div className="mb-6 flex items-end justify-between">
        <div><h2 className="section-title">Shop by category</h2><p className="mt-1 text-sm text-muted">Everything from pocket-sized to desk-sized.</p></div>
        <Link to="/categories" className="inline-flex items-center gap-1 font-label text-sm font-semibold text-brand">All categories <ArrowRight size={15} /></Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {loading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        {(data || []).map((c) => {
          const Icon = CATEGORY_ICONS[c.name] || Plug;
          return (
            <Link key={c.id} to={`/shop?categoryId=${c.id}`} className="card group flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-lift">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white"><Icon size={22} aria-hidden="true" /></span>
              <span className="min-w-0"><span className="block truncate font-nav text-sm font-bold">{c.name}</span><span className="block text-xs text-muted">{c.productCount} products</span></span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function PromoBanner() {
  const { data } = useAsync(() => productService.collection('deals', 1), []);
  const deal = data?.[0];
  return (
    <section className="container-page py-6">
      <div className="relative grid items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-navy via-slate2 to-violet2 p-8 text-white sm:p-12 md:grid-cols-2">
        <div>
          <h2 className="font-brand text-3xl font-bold text-white sm:text-4xl">{deal ? `Up to ${deal.discountPercent}% off right now` : 'This week’s best prices'}</h2>
          <p className="mt-3 max-w-md text-slate-200">{deal ? `${deal.name} is ${formatMoney(deal.currentPrice)} while stock lasts.` : 'Hand-picked discounts across every category.'}</p>
          <Link to="/deals" className="btn mt-6 bg-white text-navy hover:bg-slate-100">See all deals <ArrowRight size={16} /></Link>
        </div>
        {deal && <Link to={`/product/${deal.id}`} className="hidden justify-self-end md:block"><ImageWithFallback src={deal.imageUrl} alt={deal.name} label={deal.name} seed={deal.categoryId} className="h-56 w-72 rounded-2xl object-cover shadow-lift" /></Link>}
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  { name: 'Aarav S.', city: 'Chennai', text: 'The comparison tool made choosing between two laptops simple, and delivery tracking was accurate to the day.' },
  { name: 'Priya N.', city: 'Bengaluru', text: 'Clear pricing, no surprise charges at checkout. I could see exactly what I was paying before confirming.' },
  { name: 'Karthik S.', city: 'Coimbatore', text: 'Stock levels shown on the product page are real. My headphones arrived two days after ordering.' },
];

function Testimonials() {
  return (
    <section className="container-page py-12">
      <h2 className="section-title mb-6">What shoppers say</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name} className="card flex flex-col p-6">
            <Quote size={22} className="mb-3 text-brand" aria-hidden="true" />
            <blockquote className="flex-1 text-sm leading-relaxed text-slate2">{t.text}</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-label text-sm font-bold text-white">{t.name[0]}</span>
              <span><span className="block font-nav text-sm font-bold">{t.name}</span><span className="block text-xs text-muted">{t.city}</span></span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">Sample testimonials for this demonstration storefront.</p>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { const r = await newsletterService.subscribe(email.trim()); toast.success(r.message); setEmail(''); }
    catch (err) { toast.error(getErrorMessage(err, 'Enter a valid email address.')); }
    finally { setBusy(false); }
  };
  return (
    <section className="container-page py-8">
      <div className="card flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet2-soft text-violet2"><Mail size={22} /></span>
          <div><h2 className="font-heading text-xl font-bold">Get deals before everyone else</h2><p className="mt-1 text-sm text-muted">One email a week. Unsubscribe whenever you like.</p></div>
        </div>
        <form onSubmit={submit} className="flex w-full max-w-md gap-2">
          <label htmlFor="nl-email" className="sr-only">Email address</label>
          <input id="nl-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input" />
          <button className="btn-primary shrink-0" disabled={busy}>{busy ? 'Subscribing' : 'Subscribe'}</button>
        </form>
      </div>
    </section>
  );
}

export default function Home() {
  useDocumentTitle();
  return (
    <>
      <Hero />
      <Categories />
      <ProductRow title="Trending now" subtitle="Highly rated and in demand" type="trending" limit={4} to="/shop?sort=rating" />
      <ProductRow title="Best sellers" subtitle="What most customers are buying" type="best-sellers" limit={4} to="/shop?sort=popular" />
      <PromoBanner />
      <ProductRow title="New arrivals" subtitle="Just added to the catalogue" type="new-arrivals" limit={4} to="/shop?sort=newest" />
      <ProductRow title="Exclusive deals" subtitle="Biggest discounts first" type="deals" limit={4} to="/deals" linkLabel="All deals" />
      <ProductRow title="Recommended for you" subtitle="Top picks across categories" type="recommended" limit={4} />
      <Testimonials />
      <Newsletter />
    </>
  );
}
