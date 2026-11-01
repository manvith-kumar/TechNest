import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../utils/errors';
import { isStrongPassword, PASSWORD_HINT } from '../../utils/validation';
import FormField from '../../components/common/FormField';
import AuthShell from './AuthShell';

export default function ResetPassword() {
  useDocumentTitle('Choose a new password');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (!isStrongPassword(pw)) local.pw = PASSWORD_HINT;
    if (pw !== confirm) local.confirm = 'The passwords do not match.';
    setErrors(local); setServerError(null);
    if (Object.keys(local).length) return;
    setBusy(true);
    try { await authService.resetPassword(token, pw); toast.success('Password updated. Please sign in.'); navigate('/login', { replace: true }); }
    catch (err) { setServerError(getErrorMessage(err)); } finally { setBusy(false); }
  };

  if (!token) return <AuthShell title="Link not valid" subtitle="This reset link is missing its token." footer={<Link to="/forgot-password" className="font-semibold text-brand">Request a new link</Link>} />;
  return (
    <AuthShell title="Choose a new password" subtitle="You'll be signed out everywhere else." footer={<Link to="/login" className="font-semibold text-brand">Back to sign in</Link>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {serverError && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{serverError} <Link to="/forgot-password" className="font-semibold underline">Request a new link</Link></p>}
        <FormField label="New password" error={errors.pw} hint={PASSWORD_HINT} htmlFor="rp-pw"><input id="rp-pw" type="password" autoComplete="new-password" className={`input ${errors.pw ? 'input-error' : ''}`} value={pw} onChange={(e) => setPw(e.target.value)} /></FormField>
        <FormField label="Confirm password" error={errors.confirm} htmlFor="rp-conf"><input id="rp-conf" type="password" autoComplete="new-password" className={`input ${errors.confirm ? 'input-error' : ''}`} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></FormField>
        <button className="btn-primary btn-lg w-full" disabled={busy}>{busy ? 'Updating' : 'Update password'}</button>
      </form>
    </AuthShell>
  );
}
