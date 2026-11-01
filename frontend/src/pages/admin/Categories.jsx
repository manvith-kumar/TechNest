import { useState } from 'react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { categoryService } from '../../services/catalogService';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { PageHeader } from '../../components/admin/AdminUI';
import EmptyState, { ErrorState } from '../../components/common/EmptyState';
import FormField from '../../components/common/FormField';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import Modal from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeletons';
import { useConfirm } from '../../components/common/ConfirmationModal';

function CategoryForm({ category, onClose, onSaved }) {
  const [f, setF] = useState({ name: category?.name || '', description: category?.description || '', imageUrl: category?.imageUrl || '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) { setErrors({ name: 'Enter a category name.' }); return; }
    setBusy(true); setErrors({});
    const payload = { name: f.name.trim(), description: f.description.trim() || null, imageUrl: f.imageUrl.trim() || null };
    try { if (category) await adminService.updateCategory(category.id, payload); else await adminService.createCategory(payload); toast.success(category ? 'Category updated' : 'Category created'); onSaved(); }
    catch (err) { setErrors(getFieldErrors(err)); toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={category ? 'Edit category' : 'Add category'} footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" form="cat-form" disabled={busy}>{busy ? 'Saving' : 'Save'}</button></>}>
      <form id="cat-form" onSubmit={submit} className="space-y-4" noValidate>
        <FormField label="Name" error={errors.name} htmlFor="c-name"><input id="c-name" className={`input ${errors.name ? 'input-error' : ''}`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={100} /></FormField>
        <FormField label="Description" error={errors.description} htmlFor="c-desc"><textarea id="c-desc" rows={3} className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={500} /></FormField>
        <FormField label="Image URL" error={errors.imageUrl} hint="http(s):// link or an uploaded /uploads/ path." htmlFor="c-img"><input id="c-img" className={`input ${errors.imageUrl ? 'input-error' : ''}`} value={f.imageUrl} onChange={(e) => setF({ ...f, imageUrl: e.target.value })} /></FormField>
      </form>
    </Modal>
  );
}

export default function Categories() {
  useDocumentTitle('Categories');
  const confirm = useConfirm();
  const { data, loading, error, reload } = useAsync(() => categoryService.list(), []);
  const [editing, setEditing] = useState(null);
  const [moving, setMoving] = useState(null);   // category being deleted that still has products
  const [target, setTarget] = useState('');

  const tryDelete = async (c) => {
    if (c.productCount > 0) { setMoving(c); setTarget(''); return; }
    if (!(await confirm({ title: `Delete ${c.name}?`, message: 'This category has no products and will be removed permanently.', confirmLabel: 'Delete category' }))) return;
    try { await adminService.deleteCategory(c.id); toast.success('Category deleted'); reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };
  const moveAndDelete = async () => {
    try { await adminService.deleteCategory(moving.id, target); toast.success(`${moving.productCount} products moved. Category deleted.`); setMoving(null); reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <PageHeader title="Categories" subtitle="Group products so customers can browse them." actions={<button className="btn-primary" onClick={() => setEditing('new')}><Plus size={16} /> Add category</button>} />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}</div>}
      {data && !data.length && <div className="card"><EmptyState icon={Tags} title="No categories yet" message="Add your first category to start organising products." /></div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data?.map((c) => (
          <article key={c.id} className="card overflow-hidden">
            <div className="flex gap-4 p-4">
              <ImageWithFallback src={c.imageUrl} alt="" label={c.name} seed={c.id} className="h-20 w-20 shrink-0 rounded-xl bg-surface object-cover" />
              <div className="min-w-0"><h2 className="font-heading font-bold">{c.name}</h2><p className="line-clamp-2 text-sm text-muted">{c.description || 'No description'}</p></div>
            </div>
            <footer className="flex items-center justify-between border-t border-line bg-surface px-4 py-2.5">
              <Link to={`/shop?categoryId=${c.id}`} className="font-label text-xs font-semibold text-brand">{c.productCount} products</Link>
              <div className="flex gap-1"><button className="btn-ghost btn-sm" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}><Pencil size={14} /></button><button className="btn-ghost btn-sm text-danger" onClick={() => tryDelete(c)} aria-label={`Delete ${c.name}`}><Trash2 size={14} /></button></div>
            </footer>
          </article>
        ))}
      </div>
      {editing && <CategoryForm category={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      <Modal open={!!moving} onClose={() => setMoving(null)} size="sm" title={`Delete ${moving?.name}`}
        footer={<><button className="btn-outline" onClick={() => setMoving(null)}>Cancel</button><button className="btn-danger" disabled={!target} onClick={moveAndDelete}>Move products and delete</button></>}>
        <p className="text-sm text-slate2">This category still has <b>{moving?.productCount}</b> products. Choose where they should go. Nothing is deleted until you confirm.</p>
        <label className="label mt-4" htmlFor="reassign">Move products to</label>
        <select id="reassign" className="input" value={target} onChange={(e) => setTarget(e.target.value)}><option value="">Select a category</option>{data?.filter((c) => c.id !== moving?.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </Modal>
    </>
  );
}
