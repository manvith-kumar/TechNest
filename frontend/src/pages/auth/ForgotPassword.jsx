import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { authService } from '../../services/authService';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../utils/errors';
import { EMAIL_RE } from '../../utils/validation';
import FormField from '../../components/common/FormField';
import AuthShell from './AuthShell';

export default function ForgotPassword() {
  useDocumentTitle('Forgot password');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setError('Enter a valid email address.'); return; }
    setBusy(true); setError(null);
    try { setDone((await authService.forgotPassword(email.trim())).message); } catch (err) { setError(getErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send a reset link." footer={<Link to="/login" className="font-semibold text-brand">Back to sign in</Link>}>
      {done ? (
        <div className="rounded-xl border border-line bg-white p-6 text-center">
          <MailCheck className="mx-auto text-success" size={36} />
          <p className="mt-3 text-sm text-slate2">{done}</p>
          <p className="mt-3 text-xs text-muted">Development note: this project has no mail server. When the backend runs with LOG_RESET_LINKS=true the link is printed in the server log.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField label="Email" error={error} htmlFor="fp-email"><input id="fp-email" type="email" className={`input ${error ? 'input-error' : ''}`} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></FormField>
          <button className="btn-primary btn-lg w-full" disabled={busy}>{busy ? 'Sending' : 'Send reset link'}</button>
        </form>
      )}
    </AuthShell>
  );
}
