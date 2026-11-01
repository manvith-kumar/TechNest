import { STATUS_STYLES } from '../../utils/constants';
import { titleCase } from '../../utils/format';

export default function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_STYLES[status] || 'bg-line text-slate2'}`}>{titleCase(status)}</span>;
}
