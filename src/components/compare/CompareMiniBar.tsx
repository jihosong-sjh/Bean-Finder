import { Link, useLocation } from 'react-router-dom';
import { getBeansBatchApi } from '../../api/bean-finder.api';
import { useCompareList } from '../../features/compare/useCompareList';

export function CompareMiniBar() {
  const location = useLocation();
  const compare = useCompareList();

  if (compare.count === 0 || location.pathname === '/compare') {
    return null;
  }

  const response = getBeansBatchApi({ ids: compare.ids });
  const beans = 'data' in response.body ? response.body.data : [];

  return (
    <aside className="compare-mini-bar" aria-label="비교함">
      <div>
        <strong>
          비교함 {compare.count}/{compare.max}
        </strong>
        <span>
          {beans.map((bean) => bean.name).join(', ') || '선택한 원두'}
        </span>
      </div>
      <div className="compare-mini-bar__actions">
        <Link className="button-link" to="/compare">
          비교하기
        </Link>
        <button type="button" className="text-button" onClick={compare.clear}>
          비우기
        </button>
      </div>
    </aside>
  );
}
