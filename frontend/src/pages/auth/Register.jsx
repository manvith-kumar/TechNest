import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { EMAIL_RE, isStrongPassword, PASSWORD_HINT } from '../../utils/validation';
import FormField from '../../components/common/FormField';
import AuthShell from './AuthShell';

export default function Register() {
  useDocumentTitle('Create account');
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (form.fullName.trim().length < 2) local.fullName = 'Enter your full name.';
    if (!EMAIL_RE.test(form.email.trim())) local.email = 'Enter a valid email address.';
    if (!isStrongPassword(form.password)) local.password = PASSWORD_HINT;
    if (form.password !== form.confirm) local.confirm = 'The passwords do not match.';
    setErrors(local); setServerError(null);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      await register({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password });
      toast.success('Welcome to TechNest');
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) { setErrors(getFieldErrors(err)); setServerError(getErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Create your account" subtitle="It takes less than a minute." footer={<>Already have an account? <Link to="/login" state={location.state} className="font-semibold text-brand">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {serverError && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{serverError}</p>}
        <FormField label="Full name" error={errors.fullName} htmlFor="name"><input id="name" autoComplete="name" className={`input ${errors.fullName ? 'input-error' : ''}`} value={form.fullName} onChange={set('fullName')} /></FormField>
        <FormField label="Email" error={errors.email} htmlFor="email"><input id="email" type="email" autoComplete="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={set('email')} /></FormField>
        <FormField label="Password" error={errors.password} hint={PASSWORD_HINT} htmlFor="password"><input id="password" type="password" autoComplete="new-password" className={`input ${errors.password ? 'input-error' : ''}`} value={form.password} onChange={set('password')} /></FormField>
        <FormField label="Confirm password" error={errors.confirm} htmlFor="confirm"><input id="confirm" type="password" autoComplete="new-password" className={`input ${errors.confirm ? 'input-error' : ''}`} value={form.confirm} onChange={set('confirm')} /></FormField>
        <button className="btn-primary btn-lg w-full" disabled={busy}>{busy ? 'Creating account' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}
