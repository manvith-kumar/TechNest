import { Check, X } from 'lucide-react';
import { formatDateTime, titleCase } from '../../utils/format';

const FLOW = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function OrderTimeline({ status, history }) {
  const reached = Object.fromEntries(history.map((h) => [h.status, h]));
  if (status === 'CANCELLED') {
    return (
      <ol className="space-y-4">
        {history.map((h) => (
          <li key={h.status} className="flex gap-3">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${h.status === 'CANCELLED' ? 'bg-danger text-white' : 'bg-success text-white'}`}>{h.status === 'CANCELLED' ? <X size={14} /> : <Check size={14} />}</span>
            <div><p className="font-nav text-sm font-bold">{titleCase(h.status)}</p><p className="text-xs text-muted">{formatDateTime(h.createdAt)}{h.note ? ` · ${h.note}` : ''}</p></div>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ol className="space-y-0">
      {FLOW.map((s, i) => {
        const h = reached[s];
        return (
          <li key={s} className="relative flex gap-3 pb-6 last:pb-0">
            {i < FLOW.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 ${reached[FLOW[i + 1]] ? 'bg-success' : 'bg-line'}`} aria-hidden="true" />}
            <span className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${h ? 'bg-success text-white' : 'border-2 border-line bg-white'}`}>{h && <Check size={14} />}</span>
            <div><p className={`font-nav text-sm font-bold ${h ? '' : 'text-muted'}`}>{titleCase(s)}</p>{h && <p className="text-xs text-muted">{formatDateTime(h.createdAt)}</p>}</div>
          </li>
        );
      })}
    </ol>
  );
}
