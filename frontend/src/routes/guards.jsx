import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/common/Spinner';

/** UX guard only. The API enforces authorization independently on the server. */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

export function AdminRoute() {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/" replace state={{ denied: true }} />;
  return <Outlet />;
}

export function GuestRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to={location.state?.from || (user.role === 'ADMIN' ? '/admin' : '/')} replace />;
  return <Outlet />;
}
