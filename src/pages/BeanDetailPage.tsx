import { Link, useParams } from 'react-router-dom';
import {
  getBeanDetailApi,
  getBeanSimilarApi,
  postEventApi,
} from '../api/bean-finder.api';
import { BeanCard } from '../components/beans/BeanCard';
import { TasteScore } from '../components/beans/TasteScore';
import { ErrorState } from '../components/status/ErrorState';
import type { BeanCard as BeanCardModel } from '../features/beans/bean.search';
import {
  formatPrice,
  formatPricePer100g,
  formatWeight,
} from '../utils/price-format';

export function BeanDetailPage() {
  const { beanId } = useParams();

  if (!beanId) {
    return (
      <ErrorState
        title="원두를 찾을 수 없습니다"
        message="원두 ID가 URL에 포함되어 있지 않습니다."
      />
    );
  }

  const detailResponse = getBeanDetailApi(beanId);
  const similarResponse = getBeanSimilarApi(beanId, { limit: 6 });

  if ('error' in detailResponse.body) {
    return (
      <ErrorState
        title="원두를 찾을 수 없습니다"
        message={detailResponse.body.error.message}
      />
    );
  }

  const bean = detailResponse.body.data;
  const similarBeans =
    'data' in similarResponse.body ? similarResponse.body.data : [];
  const productUrl = bean.package.affiliate_url ?? bean.package.product_url;
  const originRows = [
    ['원산지', bean.origin.country],
    ['지역', bean.origin.region],
    ['농장', bean.origin.farm],
    ['생산자', bean.origin.producer],
    ['품종', bean.variety],
    ['가공 방식', bean.process.label],
    ['로스팅', bean.roast_level.label],
    ['디카페인', bean.flags.is_decaf ? '예' : '아니오'],
    ['판매 상태', bean.flags.is_available ? '판매 중' : '품절'],
    ['마지막 확인', bean.source.last_checked_at],
  ];

  function handleOutboundClick() {
    postEventApi({
      event_name: 'outbound_clicked',
      occurred_at: new Date().toISOString(),
      page_path: window.location.pathname,
      properties: {
        bean_id: bean.id,
        product_url: productUrl,
      },
    });
  }

  function handleSimilarOutboundClick(item: BeanCardModel) {
    postEventApi({
      event_name: 'outbound_clicked',
      occurred_at: new Date().toISOString(),
      page_path: window.location.pathname,
      properties: {
        bean_id: item.id,
        product_url: item.product_url,
      },
    });
  }

  return (
    <div className="detail-page">
      <Link className="text-link" to="/search">
        검색 결과로 돌아가기
      </Link>
      <section className="detail-hero">
        <div className="detail-hero__image">
          {bean.media.image_url ? (
            <img
              src={bean.media.image_url}
              alt={bean.media.image_alt ?? `${bean.roastery.name} ${bean.name}`}
            />
          ) : (
            <span>{bean.roastery.name}</span>
          )}
        </div>
        <div className="detail-hero__content">
          <p className="eyebrow">{bean.roastery.name}</p>
          <h1>{bean.name}</h1>
          <div className="detail-badges">
            {!bean.flags.is_available && (
              <span className="badge badge--muted">품절</span>
            )}
            {bean.flags.is_decaf && <span className="badge">디카페인</span>}
            {bean.easy_taste_tags.map((tag) => (
              <span className="badge" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className="price-block">
            <strong>{formatPrice(bean.package.price)}</strong>
            <span>{formatWeight(bean.package.weight_g)}</span>
            <span>{formatPricePer100g(bean.package.price_per_100g)}</span>
          </div>
          <div className="detail-actions">
            <button type="button">비교함 추가</button>
            {bean.flags.is_available ? (
              <a
                className="button-link"
                href={productUrl}
                target="_blank"
                rel="noreferrer"
                onClick={handleOutboundClick}
              >
                판매처 이동
              </a>
            ) : (
              <button type="button" disabled>
                판매처 이동
              </button>
            )}
          </div>
        </div>
      </section>
      <section className="detail-grid">
        <div className="detail-section">
          <div className="section-heading">
            <p className="eyebrow">맛 프로필</p>
            <h2>맛 점수</h2>
          </div>
          <TasteScore
            items={[
              scoreItem('acidity', '산미', bean.taste_profile.acidity),
              scoreItem('sweetness', '단맛', bean.taste_profile.sweetness),
              scoreItem('bitterness', '쓴맛', bean.taste_profile.bitterness),
              scoreItem('body', '바디감', bean.taste_profile.body),
              scoreItem('aroma', '향미', bean.taste_profile.aroma),
              scoreItem('balance', '밸런스', bean.taste_profile.balance),
            ]}
          />
        </div>
        <div className="detail-section">
          <div className="section-heading">
            <p className="eyebrow">기본 정보</p>
            <h2>원두 정보</h2>
          </div>
          <dl className="info-list">
            {originRows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || '정보 없음'}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <section className="detail-section">
        <div className="section-heading">
          <p className="eyebrow">컵노트</p>
          <h2>향과 맛</h2>
        </div>
        <div className="tag-list tag-list--large">
          {bean.tasting_notes.map((note) => (
            <span key={note.key}>{note.label}</span>
          ))}
        </div>
      </section>
      <section className="detail-section">
        <div className="section-heading">
          <p className="eyebrow">추천 추출</p>
          <h2>잘 맞는 방식</h2>
        </div>
        <div className="tag-list tag-list--large">
          {bean.recommended_brew_methods.map((method) => (
            <span key={method.key}>{method.label}</span>
          ))}
        </div>
      </section>
      {similarBeans.length > 0 && (
        <section className="detail-section">
          <div className="section-heading">
            <p className="eyebrow">유사 원두</p>
            <h2>비슷한 선택지</h2>
          </div>
          <div className="bean-grid">
            {similarBeans.map((item) => (
              <BeanCard
                key={item.id}
                bean={item}
                compact
                onOutboundClick={handleSimilarOutboundClick}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function scoreItem(
  key: string,
  label: string,
  value: { score: 1 | 2 | 3 | 4 | 5 | null; label: string | null },
) {
  return {
    key,
    label,
    score: value.score,
    scoreLabel: value.label,
  };
}
