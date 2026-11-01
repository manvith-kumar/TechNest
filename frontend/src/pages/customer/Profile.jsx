import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, MapPin, Package, Pencil, Plus, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { addressService } from '../../services/shopService';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { isStrongPassword, PASSWORD_HINT } from '../../utils/validation';
import AddressForm from '../../components/checkout/AddressForm';
import FormField from '../../components/common/FormField';
import EmptyState, { ErrorState } from '../../components/common/EmptyState';
import { useConfirm } from '../../components/common/ConfirmationModal';

function Details() {
  const { user, setUser, changePassword } = useAuth();
  const [form, setForm] = useState({ fullName: user.fullName, phone: user.phone || '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwBusy, setPwBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErrors({});
    try { setUser(await authService.updateProfile({ fullName: form.fullName.trim(), phone: form.phone.trim() || null })); toast.success('Profile updated'); }
    catch (err) { setErrors(getFieldErrors(err)); toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  const savePw = async (e) => {
    e.preventDefault();
    const local = {};
    if (!pw.currentPassword) local.currentPassword = 'Enter your current password.';
    if (!isStrongPassword(pw.newPassword)) local.newPassword = PASSWORD_HINT;
    if (pw.newPassword !== pw.confirm) local.confirm = 'The passwords do not match.';
    setPwErrors(local);
    if (Object.keys(local).length) return;
    setPwBusy(true);
    try { await changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }); toast.success('Password changed. Other devices have been signed out.'); setPw({ currentPassword: '', newPassword: '', confirm: '' }); }
    catch (err) { setPwErrors(getFieldErrors(err)); toast.error(getErrorMessage(err)); } finally { setPwBusy(false); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="card space-y-4 p-6" noValidate>
        <h2 className="font-heading text-lg font-bold">Personal details</h2>
        <FormField label="Full name" error={errors.fullName} htmlFor="p-name"><input id="p-name" className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></FormField>
        <FormField label="Email" hint="Your email is your sign-in and cannot be changed here." htmlFor="p-email"><input id="p-email" className="input" value={user.email} disabled /></FormField>
        <FormField label="Phone" error={errors.phone} htmlFor="p-phone"><input id="p-phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" /></FormField>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving' : 'Save changes'}</button>
      </form>
      <form onSubmit={savePw} className="card space-y-4 p-6" noValidate>
        <h2 className="font-heading text-lg font-bold">Change password</h2>
        <FormField label="Current password" error={pwErrors.currentPassword} htmlFor="pw-cur"><input id="pw-cur" type="password" autoComplete="current-password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></FormField>
        <FormField label="New password" error={pwErrors.newPassword} hint={PASSWORD_HINT} htmlFor="pw-new"><input id="pw-new" type="password" autoComplete="new-password" className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></FormField>
        <FormField label="Confirm new password" error={pwErrors.confirm} htmlFor="pw-conf"><input id="pw-conf" type="password" autoComplete="new-password" className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></FormField>
        <button className="btn-dark" disabled={pwBusy}>{pwBusy ? 'Updating' : 'Update password'}</button>
      </form>
    </div>
  );
}

function Addresses() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useAsync(() => addressService.list(), []);
  const [editing, setEditing] = useState(null);   // null | 'new' | address

  const remove = async (a) => {
    if (!(await confirm({ title: 'Remove this address?', message: `${a.label}: ${a.line1}, ${a.city}. Past orders keep their own copy of the address.`, confirmLabel: 'Remove' }))) return;
    try { await addressService.remove(a.id); toast.success('Address removed'); reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (editing) return <div className="card p-6"><h2 className="mb-4 font-heading text-lg font-bold">{editing === 'new' ? 'Add an address' : 'Edit address'}</h2><AddressForm initial={editing === 'new' ? null : editing} defaultName={user.fullName} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} /></div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="font-heading text-lg font-bold">Saved addresses</h2><button className="btn-primary btn-sm" onClick={() => setEditing('new')}><Plus size={15} /> Add address</button></div>
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && data && !data.length && <div className="card"><EmptyState icon={MapPin} title="No addresses yet" message="Save one now to speed up checkout." /></div>}
      <div className="grid gap-4 sm:grid-cols-2">
        {(data || []).map((a) => (
          <div key={a.id} className="card p-5 text-sm">
            <div className="flex items-center justify-between"><p className="font-nav font-bold">{a.label}</p>{a.defaultAddress && <span className="badge bg-brand-soft text-brand-dark">Default</span>}</div>
            <p className="mt-2 text-slate2">{a.recipientName}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} {a.postalCode}<br />{a.phone}</p>
            <div className="mt-4 flex gap-2"><button className="btn-outline btn-sm" onClick={() => setEditing(a)}><Pencil size={13} /> Edit</button><button className="btn-ghost btn-sm text-danger" onClick={() => remove(a)}><Trash2 size={13} /> Remove</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Profile() {
  useDocumentTitle('My profile');
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'details';
  const tabs = [['details', 'Profile', User], ['addresses', 'Addresses', MapPin]];
  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy font-heading text-xl font-bold text-white">{user.fullName.charAt(0).toUpperCase()}</span>
        <div><h1 className="font-heading text-2xl font-extrabold">{user.fullName}</h1><p className="text-sm text-muted">{user.email}</p></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="card h-fit p-2" aria-label="Account">
          {tabs.map(([k, label, Icon]) => (
            <button key={k} onClick={() => setParams({ tab: k })} aria-current={tab === k} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left font-nav text-sm font-semibold ${tab === k ? 'bg-brand-soft text-brand-dark' : 'text-slate2 hover:bg-surface'}`}><Icon size={16} />{label}</button>
          ))}
          <Link to="/orders" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-nav text-sm font-semibold text-slate2 hover:bg-surface"><Package size={16} /> Order history</Link>
          <Link to="/wishlist" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-nav text-sm font-semibold text-slate2 hover:bg-surface"><Heart size={16} /> Wishlist</Link>
        </nav>
        <div>{tab === 'addresses' ? <Addresses /> : <Details />}</div>
      </div>
    </div>
  );
}
