import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const CompareContext = createContext(null);
const KEY = 'technest.compare';
export const MAX_COMPARE = 4;

// Compare selection is transient UI state (not business data), so sessionStorage is appropriate here.
function load() {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch { return []; }
}

export function CompareProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
  }, [items]);

  const toggle = useCallback((p) => {
    setItems((cur) => {
      if (cur.some((i) => i.id === p.id)) return cur.filter((i) => i.id !== p.id);
      if (cur.length >= MAX_COMPARE) { toast.error(`You can compare up to ${MAX_COMPARE} products.`); return cur; }
      if (cur.length && cur[0].categoryId !== p.categoryId) {
        toast.error(`Only products in the same category can be compared (${cur[0].categoryName}).`);
        return cur;
      }
      return [...cur, { id: p.id, name: p.name, imageUrl: p.imageUrl, categoryId: p.categoryId, categoryName: p.categoryName }];
    });
  }, []);

  const remove = useCallback((id) => setItems((cur) => cur.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const has = useCallback((id) => items.some((i) => i.id === id), [items]);

  const value = useMemo(() => ({ items, toggle, remove, clear, has }), [items, toggle, remove, clear, has]);
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used inside CompareProvider');
  return ctx;
};
