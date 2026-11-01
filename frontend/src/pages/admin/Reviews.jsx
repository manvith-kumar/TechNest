import { useEffect, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { PageHeader, Panel, Toolbar } from '../../components/admin/AdminUI';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import RatingStars from '../../components/common/RatingStars';
import { useConfirm } from '../../components/common/ConfirmationModal';

export default function Reviews() {
  useDocumentTitle('Reviews');
  const confirm = useConfirm();
  const [reported, setReported] = useState(false);
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [reported]);
  const { data, loading, error, reload } = useAsync(() => adminService.reviews({ reported: reported ? 'true' : '', page, size: 10 }), [reported, page]);

  const remove = async (r) => {
    if (!(await confirm({ title: 'Remove this review?', message: `${r.userName}'s review of ${r.productName} will be deleted and the product rating recalculated.`, confirmLabel: 'Remove review' }))) return;
    try { await adminService.deleteReview(r.id); toast.success('Review removed'); reload(); } catch (err) { toast.error(getErrorMessage(err)); }
  };
  const dismiss = async (r) => { try { await adminService.dismissReport(r.id); toast.success('Report dismissed'); reload(); } catch (err) { toast.error(getErrorMessage(err)); } };

  const columns = [
    { key: 'p', header: 'Product', render: (r) => <Link to={`/product/${r.productId}`} className="font-semibold hover:text-brand">{r.productName}</Link> },
    { key: 'r', header: 'Review', render: (r) => <div className="max-w-md"><RatingStars value={r.rating} /><p className="mt-1 font-medium">{r.title || '(no headline)'}</p>{r.comment && <p className="line-clamp-2 text-xs text-muted">{r.comment}</p>}</div> },
    { key: 'u', header: 'Customer', render: (r) => r.userName },
    { key: 'd', header: 'Date', render: (r) => formatDate(r.createdAt) },
    { key: 'f', header: 'Reported', render: (r) => (r.reported ? <span className="badge bg-danger-soft text-danger">Reported</span> : <span className="text-muted">-</span>) },
    { key: 'a', header: '', className: 'text-right', render: (r) => <div className="flex justify-end gap-1">{r.reported && <button className="btn-ghost btn-sm" onClick={() => dismiss(r)} title="Dismiss report"><Check size={15} /> Keep</button>}<button className="btn-ghost btn-sm text-danger" onClick={() => remove(r)} aria-label="Remove review"><Trash2 size={15} /></button></div> },
  ];
  return (
    <>
      <PageHeader title="Reviews" subtitle="Moderate customer feedback and handle reports." />
      <Panel>
        <Toolbar><label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand" checked={reported} onChange={(e) => setReported(e.target.checked)} /> Reported reviews only</label></Toolbar>
        {error ? <p role="alert" className="p-6 text-sm text-danger">{error}</p> : <DataTable columns={columns} rows={data?.content} loading={loading} empty={<EmptyState title={reported ? 'No reported reviews' : 'No reviews yet'} message="Nothing needs your attention here." />} />}
      </Panel>
      <Pagination page={data?.page ?? 0} totalPages={data?.totalPages} onChange={setPage} />
    </>
  );
}
