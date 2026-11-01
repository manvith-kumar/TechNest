import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout';
import { AdminRoute, GuestRoute, ProtectedRoute } from './routes/guards';
import { PageLoader } from './components/common/Spinner';
import Home from './pages/customer/Home';
import Shop from './pages/customer/Shop';
import ProductDetails from './pages/customer/ProductDetails';
import Compare from './pages/customer/Compare';
import Cart from './pages/customer/Cart';
import Wishlist from './pages/customer/Wishlist';
import Checkout from './pages/customer/Checkout';
import OrderConfirmation from './pages/customer/OrderConfirmation';
import Orders from './pages/customer/Orders';
import OrderDetails from './pages/customer/OrderDetails';
import Profile from './pages/customer/Profile';
import { About, Categories, NotFound } from './pages/customer/Static';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// The admin area is a separate bundle: customers never download it.
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminInventory = lazy(() => import('./pages/admin/Inventory'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (!hash) window.scrollTo(0, 0); }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<CustomerLayout />}>
            <Route index element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/deals" element={<Shop mode="deals" />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/about" element={<About />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
