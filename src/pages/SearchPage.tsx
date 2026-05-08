import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getBeansSearchApi,
  getFilterOptionsApi,
  postEventApi,
} from '../api/bean-finder.api';
import { BeanCard } from '../components/beans/BeanCard';
import { AppliedFilterChips } from '../components/filters/AppliedFilterChips';
import { FilterPanel } from '../components/filters/FilterPanel';
import {
  filterParamKeys,
  joinParamValues,
  splitParamValue,
} from '../components/filters/filter-ui';
import { SortSelect } from '../components/filters/SortSelect';
import { ErrorState } from '../components/status/ErrorState';
import type {
  BeanCard as BeanCardModel,
  SortKey,
} from '../features/beans/bean.search';
import { useCompareList } from '../features/compare/useCompareList';

const DEFAULT_LIMIT = 20;

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') ?? '';
  const sort = (searchParams.get('sort') ?? 'recommended') as SortKey;
  const searchQuery = ensureDefaultLimit(searchParams);
  const searchResponse = getBeansSearchApi(searchQuery);
  const filterOptionsResponse = getFilterOptionsApi();
  const compare = useCompareList();

  if ('error' in searchResponse.body) {
    return (
      <ErrorState
        title="검색 조건을 확인해 주세요"
        message={searchResponse.body.error.message}
      />
    );
  }

  if ('error' in filterOptionsResponse.body) {
    return (
      <ErrorState
        title="필터를 불러오지 못했습니다"
        message={filterOptionsResponse.body.error.message}
      />
    );
  }

  const beans = searchResponse.body.data;
  const meta = searchResponse.body.meta;
  const pagination = meta.pagination;

  function replaceParams(nextParams: URLSearchParams) {
    if (!nextParams.get('sort')) {
      nextParams.set('sort', 'recommended');
    }

    navigate(`/search${nextParams.size ? `?${nextParams.toString()}` : ''}`);
  }

  function setParam(key: string, value: string | null) {
    const nextParams = new URLSearchParams(searchParams);

    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }

    nextParams.delete('limit');
    replaceParams(nextParams);
  }

  function setManyParams(values: Record<string, string | null>) {
    const nextParams = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(values)) {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    }

    nextParams.delete('limit');
    replaceParams(nextParams);
  }

  function toggleParamValue(key: string, value: string) {
    const nextParams = new URLSearchParams(searchParams);
    const values = splitParamValue(nextParams.get(key));
    const nextValues = values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];

    if (nextValues.length > 0) {
      nextParams.set(key, joinParamValues(nextValues));
    } else {
      nextParams.delete(key);
    }

    nextParams.delete('limit');
    replaceParams(nextParams);
  }

  function removeAppliedFilter(key: string, value?: string) {
    const nextParams = new URLSearchParams(searchParams);

    if (value) {
      const nextValues = splitParamValue(nextParams.get(key)).filter(
        (item) => item !== value,
      );

      if (nextValues.length > 0) {
        nextParams.set(key, joinParamValues(nextValues));
      } else {
        nextParams.delete(key);
      }
    } else {
      nextParams.delete(key);
    }

    nextParams.delete('limit');
    replaceParams(nextParams);
  }

  function resetFilters() {
    const nextParams = new URLSearchParams(searchParams);

    for (const key of filterParamKeys) {
      nextParams.delete(key);
    }

    nextParams.delete('limit');
    replaceParams(nextParams);
  }

  function resetAll() {
    navigate('/search');
  }

  function loadMore() {
    const nextParams = new URLSearchParams(searchParams);
    const currentLimit = Number(searchQuery.get('limit') ?? DEFAULT_LIMIT);
    nextParams.set('limit', String(currentLimit + DEFAULT_LIMIT));
    replaceParams(nextParams);
  }

  function handleOutboundClick(bean: BeanCardModel) {
    postEventApi({
      event_name: 'outbound_clicked',
      occurred_at: new Date().toISOString(),
      page_path: window.location.pathname,
      properties: {
        bean_id: bean.id,
        product_url: bean.product_url,
      },
    });
  }

  function handleCompare(beanId: string) {
    compare.toggle(beanId);
  }

  return (
    <div className="search-page">
      <header className="page-title">
        <p className="eyebrow">검색 결과</p>
        <div className="page-title__row">
          <div>
            <h1>{query || '전체 원두'}</h1>
            <p>
              {meta.result_count as number}개 중 {beans.length}개 표시
            </p>
          </div>
          <SortSelect
            value={sort}
            onChange={(value) => setParam('sort', value)}
          />
        </div>
        <AppliedFilterChips
          searchParams={searchParams}
          filterOptions={filterOptionsResponse.body.data}
          onRemove={removeAppliedFilter}
          onResetFilters={resetFilters}
          onResetAll={resetAll}
        />
      </header>
      <div className="search-layout">
        <FilterPanel
          searchParams={searchParams}
          filterOptions={filterOptionsResponse.body.data}
          onToggleValue={toggleParamValue}
          onSetValue={setParam}
          onSetMany={setManyParams}
        />
        <section className="results-panel" aria-label="원두 목록">
          {beans.length > 0 ? (
            <>
              <div className="bean-grid">
                {beans.map((bean) => (
                  <BeanCard
                    key={bean.id}
                    bean={bean}
                    compareSelected={compare.has(bean.id)}
                    compareDisabled={compare.isFull}
                    onCompare={handleCompare}
                    onOutboundClick={handleOutboundClick}
                  />
                ))}
              </div>
              {pagination?.has_next && (
                <button className="load-more" type="button" onClick={loadMore}>
                  더 보기
                </button>
              )}
            </>
          ) : (
            <EmptySearchResult onReset={resetAll} />
          )}
        </section>
      </div>
    </div>
  );
}

function ensureDefaultLimit(searchParams: URLSearchParams) {
  const nextParams = new URLSearchParams(searchParams);

  if (!nextParams.get('limit')) {
    nextParams.set('limit', String(DEFAULT_LIMIT));
  }

  return nextParams;
}

function EmptySearchResult({ onReset }: { onReset: () => void }) {
  return (
    <section className="empty-state">
      <p className="eyebrow">검색 결과 없음</p>
      <h2>조건에 맞는 원두를 찾지 못했습니다</h2>
      <p>검색어를 줄이거나 필터를 초기화해 다시 탐색해 보세요.</p>
      <button type="button" onClick={onReset}>
        전체 원두 보기
      </button>
    </section>
  );
}
