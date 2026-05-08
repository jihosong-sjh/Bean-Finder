import { useParams } from 'react-router-dom';
import { ErrorState } from '../components/status/ErrorState';

export function BeanDetailPage() {
  const { beanId } = useParams();

  return (
    <section className="content-panel">
      <p className="eyebrow">원두 상세</p>
      <h1>{beanId}</h1>
      <p>가격, 맛 프로필, 컵노트, 판매처 정보가 이 화면에 표시됩니다.</p>
      <ErrorState
        title="아직 데이터가 연결되지 않았습니다"
        message="M1 이후 원두 상세 데이터를 표시합니다."
      />
    </section>
  );
}
