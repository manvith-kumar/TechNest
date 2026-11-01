import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import { categoryService, productService } from '../../services/catalogService';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { SORT_OPTIONS } from '../../utils/constants';
import Pagination from '../../components/common/Pagination';
import ProductGrid from '../../components/products/ProductGrid';

const PAGE_SIZE = 12;

function Filters({ params, set, categories, brands, onClear }) {
  const selectedBrands = params.getAll('brand');
  const [min, setMin] = useState(params.get('minPrice') || '');
  const [max, setMax] = useState(params.get('maxPrice') || '');
  useEffect(() => { setMin(params.get('minPrice') || ''); setMax(params.get('maxPrice') || ''); }, [params]);

  const toggleBrand = (b) => {
    const next = selectedBrands.includes(b) ? selectedBrands.filter((x) => x !== b) : [...selectedBrands, b];
    set({ brand: next });
  };
  const applyPrice = (e) => { e.preventDefault(); set({ minPrice: min, maxPrice: max }); };
  const Group = ({ title, children }) => <fieldset className="border-b border-line py-5 first:pt-0"><legend className="mb-3 font-nav text-sm font-bold">{title}</legend>{children}</fieldset>;

  return (
    <div>
      <Group title="Category">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm"><input type="radio" name="cat" checked={!params.get('categoryId')} onChange={() => set({ categoryId: '' })} className="accent-brand" /> All categories</label>
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input type="radio" name="cat" checked={params.get('categoryId') === String(c.id)} onChange={() => set({ categoryId: c.id })} className="accent-brand" />
              <span className="flex-1">{c.name}</span><span className="text-xs text-muted">{c.productCount}</span>
            </label>
          ))}
        </div>
      </Group>
      <Group title="Brand">
        <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
          {brands.map((b) => <label key={b} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => toggleBrand(b)} className="accent-brand" /> {b}</label>)}
        </div>
      </Group>
      <Group title="Price range">
        <form onSubmit={applyPrice} className="flex items-center gap-2">
          <input type="number" min="0" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min" className="input px-2.5 py-2" aria-label="Minimum price" />
          <span className="text-muted">–</span>
          <input type="number" min="0" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Max" className="input px-2.5 py-2" aria-label="Maximum price" />
          <button className="btn-dark btn-sm">Go</button>
        </form>
      </Group>
      <Group title="Rating">
        {[4, 3, 2].map((r) => (
          <label key={r} className="mb-2 flex items-center gap-2 text-sm"><input type="radio" name="rating" checked={params.get('minRating') === String(r)} onChange={() => set({ minRating: r })} className="accent-brand" /> {r}★ and above</label>
        ))}
        <label className="flex items-center gap-2 text-sm"><input type="radio" name="rating" checked={!params.get('minRating')} onChange={() => set({ minRating: '' })} className="accent-brand" /> Any rating</label>
      </Group>
      <Group title="Availability">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={params.get('inStock') === 'true'} onChange={(e) => set({ inStock: e.target.checked ? 'true' : '' })} className="accent-brand" /> In stock only</label>
      </Group>
      <button className="btn-outline mt-5 w-full" onClick={onClear}>Clear all filters</button>
    </div>
  );
}

export default function Shop({ mode }) {
  const deals = mode === 'deals';
  useDocumentTitle(deals ? 'Deals' : 'Shop');
  const [params, setParams] = useSearchParams();
  const [layout, setLayout] = useState('grid');
  const [panel, setPanel] = useState(false);
  const categories = useAsync(() => categoryService.list(), []).data || [];
  const brands = useAsync(() => productService.brands(), []).data || [];

  // Every filter lives in the URL so results can be shared, bookmarked and survive a refresh.
  const set = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => {
      next.delete(k);
      (Array.isArray(v) ? v : [v]).filter((x) => x !== '' && x != null).forEach((x) => next.append(k, x));
    });
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  };
  const clear = () => setParams(params.get('q') ? { q: params.get('q') } : {}, { replace: true });

  const page = Number(params.get('page') || 0);
  const query = useMemo(() => ({
    q: params.get('q'), categoryId: params.get('categoryId'), brand: params.getAll('brand'),
    minPrice: params.get('minPrice'), maxPrice: params.get('maxPrice'), minRating: params.get('minRating'),
    inStock: params.get('inStock'), onSale: deals ? 'true' : undefined, sort: params.get('sort') || (deals ? 'popular' : 'newest'),
    page, size: PAGE_SIZE,
  }), [params, deals, page]);
  const { data, loading, error, reload } = useAsync(() => productService.list(query), [JSON.stringify(query)]);

  const activeCategory = categories.find((c) => String(c.id) === params.get('categoryId'));
  const chips = [
    params.get('q') && { label: `"${params.get('q')}"`, clear: { q: '' } },
    activeCategory && { label: activeCategory.name, clear: { categoryId: '' } },
    ...params.getAll('brand').map((b) => ({ label: b, clear: { brand: params.getAll('brand').filter((x) => x !== b) } })),
    (params.get('minPrice') || params.get('maxPrice')) && { label: `₹${params.get('minPrice') || 0} – ${params.get('maxPrice') || 'any'}`, clear: { minPrice: '', maxPrice: '' } },
    params.get('minRating') && { label: `${params.get('minRating')}★ & up`, clear: { minRating: '' } },
    params.get('inStock') && { label: 'In stock', clear: { inStock: '' } },
  ].filter(Boolean);

  return (
    <div className="container-page py-8">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold">{deals ? 'Deals' : activeCategory?.name || (params.get('q') ? 'Search results' : 'All products')}</h1>
        <p className="mt-1 text-sm text-muted">
          {deals ? 'Discounted products, biggest savings first.' : activeCategory?.description || 'Filter by brand, price and rating to find the right fit.'}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block"><Filters params={params} set={set} categories={categories} brands={brands} onClear={clear} /></aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button className="btn-outline btn-sm lg:hidden" onClick={() => setPanel(true)}><SlidersHorizontal size={15} /> Filters</button>
            <p className="font-label text-sm text-muted" aria-live="polite">{loading ? 'Loading' : `${data?.totalElements ?? 0} products`}</p>
            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="sort" className="sr-only">Sort by</label>
              <select id="sort" className="input w-auto py-2" value={query.sort} onChange={(e) => set({ sort: e.target.value })}>
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="hidden overflow-hidden rounded-lg border border-line sm:flex" role="group" aria-label="Layout">
                {[['grid', LayoutGrid, 'Grid view'], ['list', List, 'List view']].map(([k, Icon, label]) => (
                  <button key={k} onClick={() => setLayout(k)} aria-pressed={layout === k} aria-label={label} className={`p-2.5 ${layout === k ? 'bg-navy text-white' : 'bg-white text-slate2 hover:bg-surface'}`}><Icon size={16} /></button>
                ))}
              </div>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {chips.map((c) => (
                <button key={c.label} onClick={() => set(c.clear)} className="badge gap-1.5 bg-brand-soft py-1 text-brand-dark hover:bg-brand/20" aria-label={`Remove filter ${c.label}`}>{c.label} <X size={12} /></button>
              ))}
            </div>
          )}

          <ProductGrid products={data?.content} loading={loading} error={error} onRetry={reload} layout={layout} skeletons={PAGE_SIZE} cols="md:grid-cols-3" />
          <Pagination page={data?.page ?? 0} totalPages={data?.totalPages} onChange={(p) => { set({ page: p }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>
      </div>

      {panel && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setPanel(false)} />
          <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-white p-5">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-heading text-lg font-bold">Filters</h2><button onClick={() => setPanel(false)} className="rounded-lg p-2 hover:bg-line/60" aria-label="Close filters"><X size={18} /></button></div>
            <Filters params={params} set={set} categories={categories} brands={brands} onClear={() => { clear(); setPanel(false); }} />
            <button className="btn-primary mt-4 w-full" onClick={() => setPanel(false)}>Show {data?.totalElements ?? ''} results</button>
          </div>
        </div>
      )}
    </div>
  );
}
