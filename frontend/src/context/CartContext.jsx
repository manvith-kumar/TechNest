import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cartService } from '../services/shopService';
import { getErrorMessage } from '../utils/errors';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setCart(await cartService.get()); } catch { /* the cart page shows its own error state */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (user) refresh(); else setCart(null);
  }, [user?.id, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const requireLogin = useCallback(() => {
    toast('Sign in to continue.', { icon: '🔒', id: 'login-required' });
    navigate('/login', { state: { from: location.pathname + location.search } });
  }, [navigate, location]);

  const run = useCallback(async (action, successMessage) => {
    try {
      const next = await action();
      setCart(next);
      if (successMessage) toast.success(successMessage);
      return next;   // truthy on success, so callers can use the updated cart
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    }
  }, []);

  const addToCart = useCallback(async (productId, quantity = 1, successMessage = 'Added to your cart') => {
    if (!user) { requireLogin(); return false; }
    return run(() => cartService.add(productId, quantity), successMessage);
  }, [user, requireLogin, run]);

  const updateQuantity = useCallback((itemId, quantity) => run(() => cartService.update(itemId, quantity)), [run]);
  const removeItem = useCallback((itemId) => run(() => cartService.remove(itemId), 'Item removed from your cart'), [run]);

  const value = useMemo(
    () => ({ cart, loading, itemCount: cart?.itemCount || 0, addToCart, updateQuantity, removeItem, refresh, requireLogin, clearLocal: () => setCart(null) }),
    [cart, loading, addToCart, updateQuantity, removeItem, refresh, requireLogin]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
