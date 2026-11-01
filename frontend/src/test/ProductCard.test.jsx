import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const addToCart = vi.fn(() => Promise.resolve({}));
const toggle = vi.fn();
const compareToggle = vi.fn();
vi.mock('../context/CartContext', () => ({ useCart: () => ({ addToCart }) }));
vi.mock('../context/WishlistContext', () => ({ useWishlist: () => ({ isWished: (id) => id === 2, toggle }) }));
vi.mock('../context/CompareContext', () => ({ useCompare: () => ({ has: () => false, toggle: compareToggle }) }));
vi.mock('../components/products/QuickView', () => ({ default: () => <div>quick view open</div> }));
const { default: ProductCard } = await import('../components/products/ProductCard');

const base = { id: 1, name: 'Sony WH-1000XM5', brand: 'Sony', categoryId: 4, categoryName: 'Audio', imageUrl: null, price: 34990, discountPrice: 26990, currentPrice: 26990, discountPercent: 23, ratingAvg: 4.5, ratingCount: 12, stockQuantity: 31, inStock: true, lowStock: false };
const renderCard = (p = {}) => render(<MemoryRouter><ProductCard product={{ ...base, ...p }} /></MemoryRouter>);

describe('ProductCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows brand, name, discount and both prices', () => {
    renderCard();
    expect(screen.getByText('Sony')).toBeInTheDocument();
    expect(screen.getByText('23% off')).toBeInTheDocument();
    expect(screen.getByText(/26,990/)).toBeInTheDocument();
    expect(screen.getByText(/34,990/)).toBeInTheDocument();
    expect(screen.getByText('In stock')).toBeInTheDocument();
  });
  it('adds one unit to the cart', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(addToCart).toHaveBeenCalledWith(1, 1);
  });
  it('disables purchase when out of stock', () => {
    renderCard({ inStock: false, stockQuantity: 0 });
    expect(screen.getByRole('button', { name: /unavailable/i })).toBeDisabled();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });
  it('warns about low stock', () => {
    renderCard({ lowStock: true, stockQuantity: 3 });
    expect(screen.getByText('Only 3 left')).toBeInTheDocument();
  });
  it('toggles the wishlist and reflects state accessibly', () => {
    renderCard({ id: 2 });
    const btn = screen.getByRole('button', { name: /remove sony wh-1000xm5 from wishlist/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(btn);
    expect(toggle).toHaveBeenCalledWith(2);
  });
  it('opens quick view and offers comparison', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /quick view/i }));
    expect(screen.getByText('quick view open')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^compare/i }));
    expect(compareToggle).toHaveBeenCalled();
  });
  it('never breaks the layout when the image is missing', () => {
    renderCard({ imageUrl: 'https://broken.invalid/x.jpg' });
    const img = screen.getByAltText('Sony WH-1000XM5');
    fireEvent.error(img);
    expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
  });
});
