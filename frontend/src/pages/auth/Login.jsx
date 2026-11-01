import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../utils/errors';
import { EMAIL_RE } from '../../utils/validation';
import FormField from '../../components/common/FormField';
import AuthShell from './AuthShell';

export default function Login() {
  useDocumentTitle('Sign in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (!EMAIL_RE.test(form.email.trim())) local.email = 'Enter a valid email address.';
    if (!form.password) local.password = 'Enter your password.';
    setErrors(local); setServerError(null);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      toast.success('Signed in successfully');
      navigate(location.state?.from || (user.role === 'ADMIN' ? '/admin' : '/'), { replace: true });
    } catch (err) { setServerError(getErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your cart, orders and wishlist." footer={<>New to TechNest? <Link to="/register" state={location.state} className="font-semibold text-brand">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {serverError && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{serverError}</p>}
        <FormField label="Email" error={errors.email} htmlFor="email"><input id="email" type="email" autoComplete="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
        <FormField label="Password" error={errors.password} htmlFor="password">
          <div className="relative">
            <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" className={`input pr-11 ${errors.password ? 'input-error' : ''}`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
        </FormField>
        <div className="text-right"><Link to="/forgot-password" className="text-sm font-semibold text-brand">Forgot password?</Link></div>
        <button className="btn-primary btn-lg w-full" disabled={busy}>{busy ? 'Signing in' : 'Sign in'}</button>
      </form>
    </AuthShell>
  );
}
