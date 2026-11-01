import { PackageOpen } from 'lucide-react';

export default function EmptyState({ icon: Icon = PackageOpen, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon size={28} aria-hidden="true" />
      </div>
      <h3 className="font-heading text-lg font-bold">{title}</h3>
      {message && <p className="mt-1.5 max-w-sm text-sm text-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-14 text-center">
      <p className="font-heading text-lg font-bold">We couldn't load this</p>
      <p className="mt-1.5 max-w-md text-sm text-muted">{message}</p>
      {onRetry && <button className="btn-outline mt-5" onClick={onRetry}>Try again</button>}
    </div>
  );
}
