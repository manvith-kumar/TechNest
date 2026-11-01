import { Minus, Plus } from 'lucide-react';

export default function QuantitySelector({ value, onChange, min = 1, max = 10, disabled = false, size = 'md' }) {
  const h = size === 'sm' ? 'h-8' : 'h-10';
  return (
    <div className={`inline-flex ${h} items-center rounded-lg border border-line bg-white`} role="group" aria-label="Quantity">
      <button type="button" className="px-2.5 text-slate2 hover:text-brand disabled:opacity-40" disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)} aria-label="Decrease quantity"><Minus size={14} /></button>
      <span className="min-w-8 text-center font-label text-sm font-semibold" aria-live="polite">{value}</span>
      <button type="button" className="px-2.5 text-slate2 hover:text-brand disabled:opacity-40" disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)} aria-label="Increase quantity"><Plus size={14} /></button>
    </div>
  );
}
