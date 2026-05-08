import { useEffect, useId, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  getCategoriesApi,
  getCategoryBeansApi,
  getFilterOptionsApi,
} from '../api/bean-finder.api';
import { trackEvent } from '../api/events';
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

type CategoryMeta = {
  key: string;
  title: string;
  description: string;
  default_filters: Record<string, unknown>;
};

export function CategoryPage() {
  const { categoryKey } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const compare = useCompareList();
  const categoriesResponse = getCategoriesApi();
  const categoryList =
    'data' in categoriesResponse.body ? categoriesResponse.body.data : [];
  const categoryListItem = categoryList.find(
    (category) => category.key === categoryKey,
  );
  const sort = (searchParams.get('sort') ??
    categoryListItem?.default_sort ??
    'recommended') as SortKey;
  const categoryQuery = ensureDefaultLimit(searchParams);
  const categoryResponse = categoryKey
    ? getCategoryBeansApi(categoryKey, categoryQuery)
    : null;
  const filterOptionsResponse = getFilterOptionsApi();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const filterPanelId = useId();
  const filterTitleId = useId();

  useEffect(() => {
    if (!categoryKey) {
      return;
    }

    trackEvent({
      eventName: 'category_opened',
      properties: {
        category_key: categoryKey,
      },
    });
  }, [categoryKey]);

  if (!categoryKey || !categoryResponse || 'error' in categoryResponse.body) {
    return (
      <ErrorWithHomeLink
        title="카테고리를 찾을 수 없습니다"
        message={
          categoryResponse && 'error' in categoryResponse.body
            ? categoryResponse.body.error.message
            : '카테고리 key가 URL에 포함되어 있지 않습니다.'
        }
      />
    );
  }

  if ('error' in filterOptionsResponse.body) {
    return (
      <ErrorState
        title="필터를 불러오지 못했습니다"
        message={filterOptionsResponse.body.error.message}
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

  const beans = categoryResponse.body.data;
  const meta = categoryResponse.body.meta;
  const category = meta.category as CategoryMeta;
  const pagination = meta.pagination;
  const includeCategoryFilter =
    searchParams.get('include_category_filter') !== 'false';

  function replaceParams(nextParams: URLSearchParams) {
    if (!nextParams.get('sort')) {
      nextParams.set('sort', sort);
    }

    navigate(
      `/categories/${categoryKey}${
        nextParams.size ? `?${nextParams.toString()}` : ''
      }`,
    );
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

  function setFilterParam(key: string, value: string | null) {
    trackFilterChanged('set', {
      filter_key: key,
      value,
    });
    setParam(key, value);
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

  function setManyFilterParams(values: Record<string, string | null>) {
    trackFilterChanged('set_many', {
      values,
    });
    setManyParams(values);
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

  function toggleFilterParamValue(key: string, value: string) {
    trackFilterChanged('toggle', {
      filter_key: key,
      value,
    });
    toggleParamValue(key, value);
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
    trackFilterChanged('remove', {
      filter_key: key,
      value,
    });
    replaceParams(nextParams);
  }

  function resetFilters() {
    const nextParams = new URLSearchParams(searchParams);

    for (const key of filterParamKeys) {
      nextParams.delete(key);
    }

    nextParams.delete('limit');
    trackFilterChanged('reset_filters');
    replaceParams(nextParams);
  }

  function resetAll() {
    trackFilterChanged('reset_all');
    navigate(`/categories/${categoryKey}`);
  }

  function loadMore() {
    const nextParams = new URLSearchParams(searchParams);
    const currentLimit = Number(categoryQuery.get('limit') ?? DEFAULT_LIMIT);
    nextParams.set('limit', String(currentLimit + DEFAULT_LIMIT));
    replaceParams(nextParams);
  }

  function handleOutboundClick(bean: BeanCardModel) {
    trackEvent({
      eventName: 'outbound_clicked',
      properties: {
        bean_id: bean.id,
        product_url: bean.product_url,
      },
    });
  }

  function toggleCategoryFilter() {
    const value = includeCategoryFilter ? 'false' : null;

    trackFilterChanged('toggle_category_filter', {
      filter_key: 'include_category_filter',
      value,
    });
    setParam('include_category_filter', value);
  }

  function handleCardClick(bean: BeanCardModel) {
    trackEvent({
      eventName: 'bean_card_clicked',
      properties: {
        bean_id: bean.id,
        category_key: category.key,
        sort,
      },
    });
  }

  function handleSortChange(value: SortKey) {
    trackEvent({
      eventName: 'sort_changed',
      properties: {
        previous_sort: sort,
        sort: value,
        category_key: category.key,
        result_count: meta.result_count,
      },
    });
    setParam('sort', value);
  }

  function openFilterDrawer() {
    setIsFilterDrawerOpen(true);
  }

  function closeFilterDrawer() {
    setIsFilterDrawerOpen(false);
  }

  function trackFilterChanged(
    action: string,
    extraProperties: Record<string, unknown> = {},
  ) {
    trackEvent({
      eventName: 'filter_changed',
      properties: {
        action,
        category_key: category.key,
        sort,
        filters: Object.fromEntries(searchParams),
        result_count: meta.result_count,
        ...extraProperties,
      },
    });
  }

  return (
    <div className="search-page">
      <header className="page-title">
        <p className="eyebrow">카테고리</p>
        <div className="page-title__row">
          <div>
            <h1>{category.title}</h1>
            <p>{category.description}</p>
            <p>
              {meta.result_count as number}개 중 {beans.length}개 표시
            </p>
          </div>
          <div className="result-controls">
            <button
              type="button"
              className="filter-drawer-button"
              aria-controls={filterPanelId}
              aria-expanded={isFilterDrawerOpen}
              onClick={openFilterDrawer}
            >
              필터
            </button>
            <SortSelect value={sort} onChange={handleSortChange} />
          </div>
        </div>
        <div className="applied-filters" aria-label="카테고리 기본 조건">
          <button type="button" onClick={toggleCategoryFilter}>
            {includeCategoryFilter
              ? `카테고리 조건: ${formatDefaultFilters(
                  category.default_filters,
                )} ×`
              : '카테고리 조건 다시 적용'}
          </button>
        </div>
        <AppliedFilterChips
          searchParams={searchParams}
          filterOptions={filterOptionsResponse.body.data}
          onRemove={removeAppliedFilter}
          onResetFilters={resetFilters}
          onResetAll={resetAll}
        />
      </header>
      {isFilterDrawerOpen && (
        <button
          type="button"
          className="filter-drawer__backdrop"
          aria-label="필터 닫기"
          onClick={closeFilterDrawer}
        />
      )}
      <div className="search-layout">
        <FilterPanel
          id={filterPanelId}
          titleId={filterTitleId}
          isDrawerOpen={isFilterDrawerOpen}
          onClose={closeFilterDrawer}
          searchParams={searchParams}
          filterOptions={filterOptionsResponse.body.data}
          onToggleValue={toggleFilterParamValue}
          onSetValue={setFilterParam}
          onSetMany={setManyFilterParams}
        />
        <section className="results-panel" aria-label="카테고리 원두 목록">
          {beans.length > 0 ? (
            <>
              <div className="bean-grid">
                {beans.map((bean) => (
                  <BeanCard
                    key={bean.id}
                    bean={bean}
                    compareSelected={compare.has(bean.id)}
                    compareDisabled={compare.isFull}
                    onCardClick={handleCardClick}
                    onCompare={compare.toggle}
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
            <section className="empty-state">
              <p className="eyebrow">결과 없음</p>
              <h2>조건에 맞는 원두를 찾지 못했습니다</h2>
              <p>필터를 줄이거나 카테고리 조건을 해제해 보세요.</p>
              <button type="button" onClick={resetFilters}>
                필터 초기화
              </button>
            </section>
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

function formatDefaultFilters(filters: Record<string, unknown>) {
  return Object.entries(filters)
    .map(
      ([key, value]) =>
        `${key}=${Array.isArray(value) ? value.join(',') : value}`,
    )
    .join(', ');
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
