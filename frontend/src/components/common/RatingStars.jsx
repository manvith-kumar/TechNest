import { Star } from 'lucide-react';

export default function RatingStars({ value = 0, count, size = 14, showValue = false }) {
  const v = Number(value) || 0;
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Rated ${v.toFixed(1)} out of 5`}>
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} className={i <= Math.round(v) ? 'fill-warning text-warning' : 'fill-line text-line'} />
        ))}
      </span>
      {showValue && <span className="font-label text-xs font-semibold text-ink">{v.toFixed(1)}</span>}
      {count != null && <span className="font-label text-xs text-muted">({count})</span>}
    </span>
  );
}

export function RatingInput({ value, onChange, size = 28 }) {
  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i} star${i > 1 ? 's' : ''}`}
          onClick={() => onChange(i)} className="rounded p-0.5">
          <Star size={size} className={i <= value ? 'fill-warning text-warning' : 'text-line'} />
        </button>
      ))}
    </div>
  );
}
