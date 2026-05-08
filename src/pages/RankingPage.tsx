import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getRankingBeansApi, getRankingsApi } from '../api/bean-finder.api';
import { trackEvent } from '../api/events';
import { BeanCard } from '../components/beans/BeanCard';
import { ErrorState } from '../components/status/ErrorState';
import type { BeanCard as BeanCardModel } from '../features/beans/bean.search';
import { useCompareList } from '../features/compare/useCompareList';

type RankingMeta = {
  key: string;
  title: string;
  description: string;
  criteria: string;
};

export function RankingPage() {
  const { rankingKey } = useParams();
  const navigate = useNavigate();
  const compare = useCompareList();
  const rankingsResponse = getRankingsApi();
  const rankingResponse = rankingKey
    ? getRankingBeansApi(rankingKey, { limit: 50 })
    : null;

  useEffect(() => {
    if (!rankingKey) {
      return;
    }

    trackEvent({
      eventName: 'ranking_opened',
      properties: {
        ranking_key: rankingKey,
      },
    });
  }, [rankingKey]);

  if (!rankingKey || !rankingResponse || 'error' in rankingResponse.body) {
    return (
      <ErrorWithHomeLink
        title="랭킹을 찾을 수 없습니다"
        message={
          rankingResponse && 'error' in rankingResponse.body
            ? rankingResponse.body.error.message
            : '랭킹 key가 URL에 포함되어 있지 않습니다.'
        }
      />
    );
  }

  if ('error' in rankingsResponse.body) {
    return (
      <ErrorState
        title="랭킹 목록을 불러오지 못했습니다"
        message={rankingsResponse.body.error.message}
      >
        <Link className="button-link" to="/search">
          검색으로 이동
        </Link>
        <Link className="text-link" to="/">
          홈으로 이동
        </Link>
      </ErrorState>
    );
  }

  const rankedBeans = rankingResponse.body.data;
  const ranking = rankingResponse.body.meta.ranking as RankingMeta;

  function handleOutboundClick(bean: BeanCardModel) {
    trackEvent({
      eventName: 'outbound_clicked',
      properties: {
        bean_id: bean.id,
        product_url: bean.product_url,
      },
    });
  }

  function handleCardClick(bean: BeanCardModel) {
    trackEvent({
      eventName: 'bean_card_clicked',
      properties: {
        bean_id: bean.id,
        ranking_key: ranking.key,
      },
    });
  }

  return (
    <div className="ranking-page">
      <header className="page-title">
        <p className="eyebrow">랭킹</p>
        <div className="page-title__row">
          <div>
            <h1>{ranking.title}</h1>
            <p>{ranking.description}</p>
            <p>기준: {ranking.criteria}</p>
          </div>
          <label className="sort-select">
            <span>다른 랭킹</span>
            <select
              value={ranking.key}
              onChange={(event) => navigate(`/rankings/${event.target.value}`)}
            >
              {rankingsResponse.body.data.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      {rankedBeans.length > 0 ? (
        <ol className="ranking-list">
          {rankedBeans.map((item) => (
            <li key={item.bean.id} className="ranking-list__item">
              <span className="ranking-list__rank">{item.rank}</span>
              <BeanCard
                bean={item.bean}
                compact
                compareSelected={compare.has(item.bean.id)}
                compareDisabled={compare.isFull}
                onCardClick={handleCardClick}
                onCompare={compare.toggle}
                onOutboundClick={handleOutboundClick}
              />
            </li>
          ))}
        </ol>
      ) : (
        <section className="empty-state">
          <p className="eyebrow">결과 없음</p>
          <h2>랭킹 대상 원두가 없습니다</h2>
          <p>다른 랭킹을 선택해 원두를 탐색해 보세요.</p>
        </section>
      )}
    </div>
  );
}

function ErrorWithHomeLink({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="content-panel">
      <ErrorState title={title} message={message}>
        <Link className="button-link" to="/search">
          검색으로 이동
        </Link>
        <Link className="text-link" to="/">
          홈으로 이동
        </Link>
      </ErrorState>
    </div>
  );
}
