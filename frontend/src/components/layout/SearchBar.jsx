import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { productService } from '../../services/catalogService';
import { useDebounce } from '../../hooks/useDebounce';
import { formatMoney } from '../../utils/format';
import ImageWithFallback from '../common/ImageWithFallback';

export default function SearchBar({ className = '', autoFocus = false, onDone }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(q, 300);
  const box = useRef(null);

  useEffect(() => {
    const term = debounced.trim();
    if (term.length < 2) { setResults([]); return undefined; }
    let alive = true;
    productService.list({ q: term, size: 5 }).then((p) => alive && setResults(p.content)).catch(() => alive && setResults([]));
    return () => { alive = false; };
  }, [debounced]);

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    navigate(`/shop?q=${encodeURIComponent(term)}`);
    onDone?.();
  };
  const go = (id) => { setOpen(false); setQ(''); navigate(`/product/${id}`); onDone?.(); };

  return (
    <div ref={box} className={`relative ${className}`}>
      <form onSubmit={submit} role="search">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} autoFocus={autoFocus}
          className="input rounded-full bg-surface py-2.5 pl-10 pr-4" placeholder="Search phones, laptops, brands" aria-label="Search products" />
      </form>
      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-lift">
          {results.map((p) => (
            <li key={p.id}>
              <button onClick={() => go(p.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface">
                <ImageWithFallback src={p.imageUrl} alt="" label={p.name} seed={p.categoryId} className="h-10 w-10 rounded-md object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="block font-label text-xs text-muted">{p.brand} · {p.categoryName}</span>
                </span>
                <span className="font-brand text-sm font-semibold">{formatMoney(p.currentPrice)}</span>
              </button>
            </li>
          ))}
          <li className="border-t border-line"><button onClick={submit} className="w-full px-3 py-2.5 text-left font-label text-sm font-semibold text-brand hover:bg-surface">See all results for "{q.trim()}"</button></li>
        </ul>
      )}
    </div>
  );
}
