import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getBeansBatchApi,
  postEventApi,
  type BatchBeanCard,
} from '../api/bean-finder.api';
import { useCompareList } from '../features/compare/useCompareList';
import {
  formatPrice,
  formatPricePer100g,
  formatWeight,
} from '../utils/price-format';
import type { ReactNode } from 'react';

export function ComparePage() {
  const compare = useCompareList();
  const response =
    compare.count > 0 ? getBeansBatchApi({ ids: compare.ids }) : null;
  const beans = response && 'data' in response.body ? response.body.data : [];
  const missingIds =
    response && 'data' in response.body
      ? ((response.body.meta.missing_ids as string[] | undefined) ?? [])
      : [];

  useEffect(() => {
    postEventApi({
      event_name: 'compare_viewed',
      occurred_at: new Date().toISOString(),
      page_path: window.location.pathname,
      properties: {
        bean_ids: compare.ids,
      },
    });
  }, [compare.ids]);

  if (compare.count === 0) {
    return (
      <section className="empty-state">
        <p className="eyebrow">비교함</p>
        <h1>원두 비교</h1>
        <p>비교할 원두가 없습니다. 검색 결과에서 최대 4개까지 담아 보세요.</p>
        <Link className="button-link" to="/search">
          원두 추가하러 가기
        </Link>
      </section>
    );
  }

  return (
    <div className="compare-page">
      <header className="page-title">
        <p className="eyebrow">비교함</p>
        <div className="page-title__row">
          <div>
            <h1>원두 비교</h1>
            <p>
              {compare.count}/{compare.max}개 원두의 가격, 맛 점수, 컵노트를
              비교합니다.
            </p>
          </div>
          <button type="button" className="text-button" onClick={compare.clear}>
            전체 비우기
          </button>
        </div>
        {compare.count === 1 && (
          <p className="compare-page__hint">
            원두를 더 추가하면 항목별 차이를 나란히 볼 수 있습니다.
          </p>
        )}
        {missingIds.length > 0 && (
          <p className="compare-page__hint">
            찾을 수 없는 원두 {missingIds.length}개는 비교에서 제외했습니다.
          </p>
        )}
      </header>

      <DesktopCompareTable beans={beans} onRemove={compare.remove} />
      <MobileCompareList beans={beans} onRemove={compare.remove} />
    </div>
  );
}

function DesktopCompareTable({
  beans,
  onRemove,
}: {
  beans: BatchBeanCard[];
  onRemove: (beanId: string) => void;
}) {
  const rows = buildCompareRows(beans);

  return (
    <div className="compare-table-wrap">
      <table className="compare-table">
        <thead>
          <tr>
            <th scope="col">항목</th>
            {beans.map((bean) => (
              <th scope="col" key={bean.id}>
                <div className="compare-table__bean">
                  <Link to={`/beans/${bean.slug}`}>{bean.name}</Link>
                  <span>{bean.roastery.name}</span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => onRemove(bean.id)}
                  >
                    제거
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.values.map((value, index) => (
                <td key={`${row.label}:${beans[index].id}`}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileCompareList({
  beans,
  onRemove,
}: {
  beans: BatchBeanCard[];
  onRemove: (beanId: string) => void;
}) {
  return (
    <div className="compare-mobile-list" aria-label="모바일 비교 목록">
      {beans.map((bean) => (
        <article className="compare-mobile-card" key={bean.id}>
          <div className="compare-mobile-card__header">
            <div>
              <p className="eyebrow">{bean.roastery.name}</p>
              <h2>
                <Link to={`/beans/${bean.slug}`}>{bean.name}</Link>
              </h2>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() => onRemove(bean.id)}
            >
              제거
            </button>
          </div>
          <dl className="info-list">
            {buildMobileRows(bean).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function buildCompareRows(beans: BatchBeanCard[]) {
  return [
    row('가격', beans, (bean) => formatPrice(bean.price)),
    row('용량', beans, (bean) => formatWeight(bean.weight_g)),
    row('100g당 가격', beans, (bean) =>
      formatPricePer100g(bean.price_per_100g),
    ),
    row('원산지', beans, formatOrigin),
    row('로스팅', beans, (bean) => bean.roast_level.label),
    row('산미', beans, (bean) => formatScore(bean.taste_profile.acidity)),
    row('단맛', beans, (bean) => formatScore(bean.taste_profile.sweetness)),
    row('쓴맛', beans, (bean) => formatScore(bean.taste_profile.bitterness)),
    row('바디감', beans, (bean) => formatScore(bean.taste_profile.body)),
    row('컵노트', beans, (bean) => (
      <InlineTags values={bean.tasting_notes.map((note) => note.label)} />
    )),
    row('추출 방식', beans, (bean) => (
      <InlineTags
        values={bean.recommended_brew_methods.map((method) => method.label)}
      />
    )),
    row('판매 상태', beans, (bean) => (bean.is_available ? '판매 중' : '품절')),
    row('판매처', beans, (bean) =>
      bean.is_available ? (
        <a href={bean.product_url} target="_blank" rel="noreferrer">
          판매처 이동
        </a>
      ) : (
        '이동 불가'
      ),
    ),
  ];
}

function buildMobileRows(bean: BatchBeanCard): Array<[string, ReactNode]> {
  return buildCompareRows([bean]).map((item) => [item.label, item.values[0]]);
}

function row(
  label: string,
  beans: BatchBeanCard[],
  getValue: (bean: BatchBeanCard) => ReactNode,
) {
  return {
    label,
    values: beans.map(getValue),
  };
}

function formatOrigin(bean: BatchBeanCard) {
  return [bean.origin.country, bean.origin.region].filter(Boolean).join(' / ');
}

function formatScore(score: { score: number; label: string }) {
  return `${score.score}/5 ${score.label}`;
}

function InlineTags({ values }: { values: string[] }) {
  return (
    <div className="tag-list">
      {values.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </div>
  );
}
