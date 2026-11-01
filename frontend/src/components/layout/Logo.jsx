import { Link } from 'react-router-dom';

export default function Logo({ light = false }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5" aria-label="TechNest home">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M12 7v11" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>
      </span>
      <span className={`font-brand text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-navy'}`}>TechNest</span>
    </Link>
  );
}
