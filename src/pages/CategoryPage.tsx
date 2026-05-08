import { useParams } from 'react-router-dom';

export function CategoryPage() {
  const { categoryKey } = useParams();

  return (
    <section className="content-panel">
      <p className="eyebrow">카테고리</p>
      <h1>{categoryKey}</h1>
      <p>카테고리 조건에 맞는 원두 목록이 표시됩니다.</p>
    </section>
  );
}
