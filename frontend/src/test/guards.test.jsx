import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = { user: null, loading: false, isAdmin: false };
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));
const { AdminRoute, GuestRoute, ProtectedRoute } = await import('../routes/guards');

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/login" element={<p>login page</p>} />
      <Route path="/" element={<p>home page</p>} />
      <Route path="/admin" element={<p>admin home</p>} />
      <Route element={<ProtectedRoute />}><Route path="/cart" element={<p>cart page</p>} /></Route>
      <Route element={<AdminRoute />}><Route path="/admin/products" element={<p>admin products</p>} /></Route>
      <Route element={<GuestRoute />}><Route path="/register" element={<p>register page</p>} /></Route>
    </Routes>
  </MemoryRouter>
);

describe('route guards', () => {
  beforeEach(() => Object.assign(auth, { user: null, loading: false, isAdmin: false }));

  it('sends anonymous visitors from private pages to login', () => {
    renderAt('/cart');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });
  it('lets signed-in customers into private pages', () => {
    Object.assign(auth, { user: { id: 1, role: 'CUSTOMER' } });
    renderAt('/cart');
    expect(screen.getByText('cart page')).toBeInTheDocument();
  });
  it('keeps customers out of the admin area', () => {
    Object.assign(auth, { user: { id: 1, role: 'CUSTOMER' }, isAdmin: false });
    renderAt('/admin/products');
    expect(screen.queryByText('admin products')).not.toBeInTheDocument();
    expect(screen.getByText('home page')).toBeInTheDocument();
  });
  it('lets admins in', () => {
    Object.assign(auth, { user: { id: 2, role: 'ADMIN' }, isAdmin: true });
    renderAt('/admin/products');
    expect(screen.getByText('admin products')).toBeInTheDocument();
  });
  it('sends anonymous visitors from admin pages to login', () => {
    renderAt('/admin/products');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });
  it('shows nothing private while the session is being restored', () => {
    Object.assign(auth, { loading: true });
    renderAt('/cart');
    expect(screen.queryByText('cart page')).not.toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });
  it('redirects signed-in users away from the sign-up page', () => {
    Object.assign(auth, { user: { id: 1, role: 'CUSTOMER' } });
    renderAt('/register');
    expect(screen.getByText('home page')).toBeInTheDocument();
  });
});
