import { useState } from 'react';
import toast from 'react-hot-toast';
import { addressService } from '../../services/shopService';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import FormField from '../common/FormField';

const EMPTY = { label: 'Home', recipientName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India', defaultAddress: false };

export default function AddressForm({ initial, defaultName = '', onSaved, onCancel }) {
  const [f, setF] = useState(initial ? { ...EMPTY, ...initial, line2: initial.line2 || '' } : { ...EMPTY, recipientName: defaultName });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (!f.recipientName.trim()) local.recipientName = 'Enter the recipient name.';
    if (!/^[+0-9][0-9 ()-]{6,18}$/.test(f.phone.trim())) local.phone = 'Enter a valid phone number.';
    if (!f.line1.trim()) local.line1 = 'Enter the street address.';
    if (!f.city.trim()) local.city = 'Enter the city.';
    if (!f.state.trim()) local.state = 'Enter the state.';
    if (!/^[A-Za-z0-9 -]{3,12}$/.test(f.postalCode.trim())) local.postalCode = 'Enter a valid postal code.';
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      const payload = { ...f, line2: f.line2.trim() || null };
      const saved = initial?.id ? await addressService.update(initial.id, payload) : await addressService.create(payload);
      toast.success(initial?.id ? 'Address updated' : 'Address saved');
      onSaved(saved);
    } catch (err) { setErrors(getFieldErrors(err)); toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  const input = (k, label, extra = {}) => (
    <FormField label={label} error={errors[k]} htmlFor={`addr-${k}`}>
      <input id={`addr-${k}`} className={`input ${errors[k] ? 'input-error' : ''}`} value={f[k]} onChange={set(k)} {...extra} />
    </FormField>
  );

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      {input('label', 'Label (Home, Office)', { maxLength: 40 })}
      {input('recipientName', 'Recipient name', { autoComplete: 'name' })}
      {input('phone', 'Phone', { autoComplete: 'tel', inputMode: 'tel' })}
      {input('postalCode', 'Postal code', { autoComplete: 'postal-code' })}
      <div className="sm:col-span-2">{input('line1', 'Address line 1', { autoComplete: 'address-line1' })}</div>
      <div className="sm:col-span-2">{input('line2', 'Address line 2 (optional)', { autoComplete: 'address-line2' })}</div>
      {input('city', 'City', { autoComplete: 'address-level2' })}
      {input('state', 'State', { autoComplete: 'address-level1' })}
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={f.defaultAddress} onChange={set('defaultAddress')} className="accent-brand" /> Make this my default address</label>
      <div className="flex gap-2 sm:col-span-2">
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving' : 'Save address'}</button>
        {onCancel && <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
