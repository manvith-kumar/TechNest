import { Link } from 'react-router-dom';
import Logo from '../../components/layout/Logo';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="font-heading text-3xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
        </div>
        <Link to="/" className="text-sm text-muted hover:text-ink">← Back to the store</Link>
      </div>
      <div className="relative hidden overflow-hidden bg-navy lg:block" aria-hidden="true">
        <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-brand/30 blur-3xl" />
        <div className="relative flex h-full flex-col justify-end p-14">
          <p className="max-w-md font-brand text-4xl font-bold leading-tight text-white">Discover. Explore. Shop.</p>
          <p className="mt-4 max-w-sm text-slate-300">Track every order, save products for later and check out in a few taps.</p>
        </div>
      </div>
    </div>
  );
}
