import { useEffect, useRef, useState } from 'react';
import { Pencil, Plus, Star, Trash2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { categoryService } from '../../services/catalogService';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { formatMoney } from '../../utils/format';
import { PageHeader, Panel, Toolbar } from '../../components/admin/AdminUI';
import DataTable from '../../components/common/DataTable';
import FormField from '../../components/common/FormField';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { useConfirm } from '../../components/common/ConfirmationModal';

const BLANK = { name: '', brand: '', categoryId: '', description: '', price: '', discountPrice: '', stockQuantity: 0, lowStockThreshold: 5, featured: false, active: true, images: [{ url: '', altText: '' }], specifications: [] };

function ProductForm({ product, categories, onClose, onSaved }) {
  const [f, setF] = useState(() => (product ? { ...BLANK, ...product, categoryId: product.categoryId, discountPrice: product.discountPrice ?? '', images: product.images.length ? product.images : BLANK.images, specifications: product.specifications.map((s) => ({ ...s })) } : BLANK));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const setImage = (i, patch) => setF({ ...f, images: f.images.map((im, x) => (x === i ? { ...im, ...patch } : im)) });
  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const { url } = await adminService.upload(file); setF((cur) => ({ ...cur, images: [...cur.images.filter((im) => im.url.trim()), { url, altText: '' }] })); toast.success('Image uploaded'); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setUploading(false); e.target.value = ''; }
  };

  const validate = () => {
    const er = {};
    if (!f.name.trim()) er.name = 'Enter a product name.';
    if (!f.brand.trim()) er.brand = 'Enter the brand.';
    if (!f.categoryId) er.categoryId = 'Choose a category.';
    if (!f.description.trim()) er.description = 'Enter a description.';
    if (!(Number(f.price) > 0)) er.price = 'Enter a price above 0.';
    if (f.discountPrice !== '' && !(Number(f.discountPrice) > 0 && Number(f.discountPrice) < Number(f.price))) er.discountPrice = 'The discount price must be lower than the price.';
    if (!(Number.isInteger(Number(f.stockQuantity)) && Number(f.stockQuantity) >= 0)) er.stockQuantity = 'Stock must be a whole number, 0 or more.';
    const imgs = f.images.filter((im) => im.url.trim());
    if (!imgs.length) er.images = 'Add at least one image URL or upload one.';
    else if (imgs.some((im) => !/^(https?:\/\/|\/uploads\/).{3,}/.test(im.url.trim()))) er.images = 'Image URLs must start with http(s):// or be uploaded files.';
    if (f.specifications.some((s) => !s.key.trim() || !s.value.trim())) er.specifications = 'Fill in or remove empty specification rows.';
    return er;
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = validate(); setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const payload = {
      name: f.name.trim(), brand: f.brand.trim(), categoryId: Number(f.categoryId), description: f.description.trim(),
      price: Number(f.price), discountPrice: f.discountPrice === '' ? null : Number(f.discountPrice),
      stockQuantity: Number(f.stockQuantity), lowStockThreshold: Number(f.lowStockThreshold) || 0, featured: f.featured, active: f.active,
      images: f.images.filter((im) => im.url.trim()).map((im) => ({ url: im.url.trim(), altText: im.altText?.trim() || null })),
      specifications: f.specifications.map((s) => ({ key: s.key.trim(), value: s.value.trim() })),
    };
    try {
      if (product) await adminService.updateProduct(product.id, payload); else await adminService.createProduct(payload);
      toast.success(product ? 'Product updated' : 'Product created'); onSaved();
    } catch (err) { setErrors(getFieldErrors(err)); toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };

  const text = (k, label, props = {}) => <FormField label={label} error={errors[k]} htmlFor={`pf-${k}`}><input id={`pf-${k}`} className={`input ${errors[k] ? 'input-error' : ''}`} value={f[k]} onChange={set(k)} {...props} /></FormField>;

  return (
    <Modal open onClose={onClose} size="xl" title={product ? `Edit ${product.name}` : 'Add product'}
      footer={<><button className="btn-outline" type="button" onClick={onClose}>Cancel</button><button className="btn-primary" form="product-form" disabled={busy}>{busy ? 'Saving' : 'Save product'}</button></>}>
      <form id="product-form" onSubmit={submit} noValidate className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">{text('name', 'Product name', { maxLength: 200 })}</div>
        {text('brand', 'Brand', { maxLength: 80 })}
        <FormField label="Category" error={errors.categoryId} htmlFor="pf-cat"><select id="pf-cat" className={`input ${errors.categoryId ? 'input-error' : ''}`} value={f.categoryId} onChange={set('categoryId')}><option value="">Select a category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FormField>
        <div className="md:col-span-2"><FormField label="Description" error={errors.description} htmlFor="pf-desc"><textarea id="pf-desc" rows={4} className={`input ${errors.description ? 'input-error' : ''}`} value={f.description} onChange={set('description')} maxLength={5000} /></FormField></div>
        {text('price', 'Price', { type: 'number', min: 0, step: '0.01' })}
        {text('discountPrice', 'Discount price (optional)', { type: 'number', min: 0, step: '0.01' })}
        {text('stockQuantity', 'Stock quantity', { type: 'number', min: 0, step: 1 })}
        {text('lowStockThreshold', 'Low-stock threshold', { type: 'number', min: 0, step: 1 })}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand" checked={f.featured} onChange={set('featured')} /> Featured on the storefront</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand" checked={f.active} onChange={set('active')} /> Active (visible to customers)</label>

        <fieldset className="md:col-span-2">
          <legend className="label">Images <span className="font-normal text-muted">(first image is the main one)</span></legend>
          <div className="space-y-2">
            {f.images.map((im, i) => (
              <div key={i} className="flex items-center gap-2">
                <ImageWithFallback src={im.url} alt="" label="Preview" className="h-10 w-10 shrink-0 rounded-md bg-surface object-cover" />
                <input className="input" placeholder="https://… or uploaded file" value={im.url} onChange={(e) => setImage(i, { url: e.target.value })} aria-label={`Image ${i + 1} URL`} />
                <button type="button" className="btn-ghost btn-sm" disabled={i === 0} onClick={() => setF({ ...f, images: [f.images[i], ...f.images.filter((_, x) => x !== i)] })} aria-label="Make main image" title="Make main image"><Star size={15} className={i === 0 ? 'fill-warning text-warning' : ''} /></button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setF({ ...f, images: f.images.filter((_, x) => x !== i) })} aria-label="Remove image"><X size={15} /></button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" className="btn-outline btn-sm" onClick={() => setF({ ...f, images: [...f.images, { url: '', altText: '' }] })}><Plus size={14} /> Add URL</button>
            <button type="button" className="btn-outline btn-sm" disabled={uploading} onClick={() => fileRef.current?.click()}><Upload size={14} /> {uploading ? 'Uploading' : 'Upload image'}</button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={upload} />
          </div>
          {errors.images && <p className="field-error">{errors.images}</p>}
        </fieldset>

        <fieldset className="md:col-span-2">
          <legend className="label">Specifications</legend>
          <div className="space-y-2">
            {f.specifications.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input className="input w-1/3" placeholder="Name (e.g. Battery)" value={s.key} onChange={(e) => setF({ ...f, specifications: f.specifications.map((x, n) => (n === i ? { ...x, key: e.target.value } : x)) })} aria-label={`Specification ${i + 1} name`} />
                <input className="input flex-1" placeholder="Value" value={s.value} onChange={(e) => setF({ ...f, specifications: f.specifications.map((x, n) => (n === i ? { ...x, value: e.target.value } : x)) })} aria-label={`Specification ${i + 1} value`} />
                <button type="button" className="btn-ghost btn-sm" onClick={() => setF({ ...f, specifications: f.specifications.filter((_, n) => n !== i) })} aria-label="Remove specification"><X size={15} /></button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-outline btn-sm mt-2" onClick={() => setF({ ...f, specifications: [...f.specifications, { key: '', value: '' }] })}><Plus size={14} /> Add specification</button>
          {errors.specifications && <p className="field-error">{errors.specifications}</p>}
        </fieldset>
      </form>
    </Modal>
  );
}

export default function Products() {
  useDocumentTitle('Products');
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [active, setActive] = useState('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);   // null | 'new' | full product detail
  const dq = useDebounce(q);
  useEffect(() => setPage(0), [dq, categoryId, active]);
  const categories = useAsync(() => categoryService.list(), []).data || [];
  const { data, loading, error, reload } = useAsync(() => adminService.products({ q: dq, categoryId, active, page, size: 10 }), [dq, categoryId, active, page]);

  const edit = async (id) => { try { setEditing(await adminService.product(id)); } catch (err) { toast.error(getErrorMessage(err)); } };
  const remove = async (p) => {
    if (!(await confirm({ title: `Delete ${p.name}?`, message: 'Products that appear in past orders are deactivated instead of deleted so order history stays intact.', confirmLabel: 'Delete product' }))) return;
    try { const r = await adminService.deleteProduct(p.id); toast.success(r.message); reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const columns = [
    { key: 'name', header: 'Product', render: (p) => <div className="flex items-center gap-3"><ImageWithFallback src={p.imageUrl} alt="" label={p.name} seed={p.categoryId} className="h-11 w-11 rounded-lg bg-surface object-cover" /><div className="min-w-0"><p className="max-w-[260px] truncate font-semibold">{p.name}</p><p className="text-xs text-muted">{p.brand} · {p.categoryName}</p></div></div> },
    { key: 'price', header: 'Price', render: (p) => <span className="font-brand font-semibold">{formatMoney(p.currentPrice)}{p.discountPrice != null && <span className="ml-1.5 text-xs font-normal text-muted line-through">{formatMoney(p.price)}</span>}</span> },
    { key: 'stock', header: 'Stock', render: (p) => <span className={`badge ${!p.inStock ? 'bg-danger-soft text-danger' : p.lowStock ? 'bg-warning-soft text-amber-700' : 'bg-success-soft text-success'}`}>{p.stockQuantity}</span> },
    { key: 'state', header: 'Status', render: (p) => <div className="flex gap-1.5"><span className={`badge ${p.active ? 'bg-success-soft text-success' : 'bg-line text-slate2'}`}>{p.active ? 'Active' : 'Inactive'}</span>{p.featured && <span className="badge bg-violet2-soft text-violet2">Featured</span>}</div> },
    { key: 'actions', header: '', className: 'text-right', render: (p) => <div className="flex justify-end gap-1"><button className="btn-ghost btn-sm" onClick={() => edit(p.id)} aria-label={`Edit ${p.name}`}><Pencil size={15} /></button><button className="btn-ghost btn-sm text-danger" onClick={() => remove(p)} aria-label={`Delete ${p.name}`}><Trash2 size={15} /></button></div> },
  ];

  return (
    <>
      <PageHeader title="Products" subtitle="Create, edit and retire catalogue items." actions={<button className="btn-primary" onClick={() => setEditing('new')}><Plus size={16} /> Add product</button>} />
      <Panel>
        <Toolbar>
          <input className="input max-w-xs" placeholder="Search name or brand" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
          <select className="input w-auto" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Filter by category"><option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select className="input w-auto" value={active} onChange={(e) => setActive(e.target.value)} aria-label="Filter by status"><option value="">Any status</option><option value="true">Active</option><option value="false">Inactive</option></select>
        </Toolbar>
        {error ? <p role="alert" className="p-6 text-sm text-danger">{error} <button className="font-semibold underline" onClick={reload}>Retry</button></p> : <DataTable columns={columns} rows={data?.content} loading={loading} />}
      </Panel>
      <Pagination page={data?.page ?? 0} totalPages={data?.totalPages} onChange={setPage} />
      {editing && <ProductForm product={editing === 'new' ? null : editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}
