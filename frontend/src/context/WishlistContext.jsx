import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { wishlistService } from '../services/shopService';
import { getErrorMessage } from '../utils/errors';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const { requireLogin } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    wishlistService.list().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const ids = useMemo(() => new Set(items.map((i) => i.product.id)), [items]);
  const isWished = useCallback((id) => ids.has(id), [ids]);

  const toggle = useCallback(async (productId) => {
    if (!user) { requireLogin(); return; }
    const wished = ids.has(productId);
    try {
      setItems(wished ? await wishlistService.remove(productId) : await wishlistService.add(productId));
      toast.success(wished ? 'Removed from your wishlist' : 'Saved to your wishlist');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, [user, ids, requireLogin]);

  const remove = useCallback(async (productId) => {
    try { setItems(await wishlistService.remove(productId)); } catch (err) { toast.error(getErrorMessage(err)); }
  }, []);

  const value = useMemo(() => ({ items, loading, count: items.length, isWished, toggle, remove }), [items, loading, isWished, toggle, remove]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
};
