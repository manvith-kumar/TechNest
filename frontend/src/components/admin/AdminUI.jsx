import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-nav text-2xl font-extrabold">{title}</h1>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function DashboardCard({ icon: Icon, label, value, tone = 'brand', hint, to }) {
  const tones = { brand: 'bg-brand-soft text-brand', success: 'bg-success-soft text-success', warning: 'bg-warning-soft text-amber-700', danger: 'bg-danger-soft text-danger', violet: 'bg-violet2-soft text-violet2' };
  return (
    <div className="card flex items-start gap-4 p-5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={20} aria-hidden="true" /></span>
      <div className="min-w-0"><p className="font-label text-sm text-muted">{label}</p><p className="font-brand text-2xl font-bold">{value}</p>{hint && <p className="text-xs text-muted">{hint}</p>}</div>
    </div>
  );
}

export const Panel = ({ title, actions, children, className = '' }) => (
  <section className={`card ${className}`}>
    {(title || actions) && <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4"><h2 className="font-nav text-base font-bold">{title}</h2>{actions}</header>}
    {children}
  </section>
);

export const Toolbar = ({ children }) => <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">{children}</div>;

export const Delta = ({ up }) => (up ? <ArrowUpRight size={14} className="text-success" /> : <ArrowDownRight size={14} className="text-danger" />);
