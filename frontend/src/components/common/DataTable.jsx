import EmptyState from './EmptyState';
import { TableSkeleton } from './Skeletons';

/** columns: [{ key, header, render?(row), className? }] */
export default function DataTable({ columns, rows, loading, rowKey = 'id', empty, onRowClick }) {
  if (loading) return <TableSkeleton cols={Math.min(columns.length, 6)} />;
  if (!rows?.length) return empty || <EmptyState title="Nothing here yet" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-surface">
            {columns.map((c) => <th key={c.key} scope="col" className={`px-4 py-3 font-label text-xs font-semibold text-muted ${c.className || ''}`}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row[rowKey]} className={onRowClick ? 'cursor-pointer hover:bg-surface' : ''} onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {columns.map((c) => <td key={c.key} className={`px-4 py-3 align-middle ${c.className || ''}`}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
