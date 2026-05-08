import { Link } from 'react-router-dom';
import { ErrorState } from '../components/status/ErrorState';

export function NotFoundPage() {
  return (
    <section className="content-panel">
      <ErrorState
        title="페이지를 찾을 수 없습니다"
        message="주소를 확인하거나 홈으로 이동해 주세요."
      />
      <Link className="text-link" to="/">
        홈으로 이동
      </Link>
    </section>
  );
}
