import { useSearchParams } from 'react-router-dom';
import { LoadingState } from '../components/status/LoadingState';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '전체 원두';

  return (
    <section className="content-panel">
      <p className="eyebrow">검색 결과</p>
      <h1>{query}</h1>
      <p>검색, 필터, 정렬 결과 목록이 이 화면에 표시됩니다.</p>
      <LoadingState label="원두 데이터를 연결할 준비 중" />
    </section>
  );
}
