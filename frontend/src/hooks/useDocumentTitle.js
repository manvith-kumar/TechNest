import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | TechNest` : 'TechNest | Discover. Explore. Shop.';
  }, [title]);
}
