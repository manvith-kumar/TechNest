import { Link, useNavigate } from 'react-router-dom';
import { GitCompareArrows, X } from 'lucide-react';
import { MAX_COMPARE, useCompare } from '../../context/CompareContext';
import ImageWithFallback from '../common/ImageWithFallback';

export default function CompareBar() {
  const { items, remove, clear } = useCompare();
  const navigate = useNavigate();
  if (!items.length) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white shadow-lift">
      <div className="container-page flex items-center gap-3 py-3">
        <GitCompareArrows size={20} className="hidden text-brand sm:block" aria-hidden="true" />
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {items.map((i) => (
            <span key={i.id} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2">
              <ImageWithFallback src={i.imageUrl} alt="" label={i.name} seed={i.categoryId} className="h-7 w-7 rounded-full object-cover" />
              <Link to={`/product/${i.id}`} className="max-w-[9rem] truncate font-label text-xs font-semibold">{i.name}</Link>
              <button onClick={() => remove(i.id)} aria-label={`Remove ${i.name} from comparison`} className="text-muted hover:text-danger"><X size={14} /></button>
            </span>
          ))}
        </div>
        <span className="hidden font-label text-xs text-muted sm:block">{items.length}/{MAX_COMPARE} selected</span>
        <button className="btn-ghost btn-sm" onClick={clear}>Clear</button>
        <button className="btn-primary btn-sm" disabled={items.length < 2} onClick={() => navigate(`/compare?ids=${items.map((i) => i.id).join(',')}`)}>
          {items.length < 2 ? 'Add one more' : 'Compare now'}
        </button>
      </div>
    </div>
  );
}
