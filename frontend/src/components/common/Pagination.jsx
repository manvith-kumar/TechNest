import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
  for (let i = start; i < Math.min(totalPages, start + 5); i++) pages.push(i);
  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button className="btn-outline btn-sm" disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
      {pages.map((p) => (
        <button key={p} onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined}
          className={`h-8 min-w-8 rounded-lg px-2 font-label text-sm font-semibold ${p === page ? 'bg-navy text-white' : 'text-slate2 hover:bg-line/70'}`}>
          {p + 1}
        </button>
      ))}
      <button className="btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
    </nav>
  );
}
