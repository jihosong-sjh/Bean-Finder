import { useParams } from 'react-router-dom';

export function RankingPage() {
  const { rankingKey } = useParams();

  return (
    <section className="content-panel">
      <p className="eyebrow">랭킹</p>
      <h1>{rankingKey}</h1>
      <p>랭킹 기준으로 정렬된 원두 목록이 표시됩니다.</p>
    </section>
  );
}
