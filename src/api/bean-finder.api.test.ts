import { describe, expect, it } from 'vitest';
import {
  getBeanDetailApi,
  getBeansBatchApi,
  getBeansSearchApi,
  getBeanSimilarApi,
  getCategoriesApi,
  getCategoryBeansApi,
  getFilterOptionsApi,
  getHomeApi,
  getRankingBeansApi,
  getRankingsApi,
  postEventApi,
  postInternalBeansValidateApi,
} from './bean-finder.api';
import type { ApiFailure, ApiSuccess } from './api.response';
import { apiError, apiSuccess } from './api.response';
import type { BeanCard } from '../features/beans/bean.search';
import { loadBeanData } from '../features/beans/bean.repository';

function expectSuccess<TData>(result: ApiSuccess<TData> | ApiFailure) {
  expect(result.status).toBe(200);
  expect('data' in result.body).toBe(true);

  return result as ApiSuccess<TData>;
}

function expectFailure(
  result: ApiSuccess<unknown> | ApiFailure,
  status: number,
) {
  expect(result.status).toBe(status);
  expect('error' in result.body).toBe(true);

  return result as ApiFailure;
}

describe('api response helpers', () => {
  it('creates success body with request id', () => {
    const result = apiSuccess({ ok: true });

    expect(result).toMatchObject({
      status: 200,
      body: {
        data: { ok: true },
        meta: {
          request_id: expect.stringMatching(/^req_/),
        },
      },
    });
  });

  it('creates error body with common error shape', () => {
    const result = apiError(400, 'INVALID_QUERY', '잘못된 요청입니다.', [
      { field: 'q', reason: '테스트 오류' },
    ]);

    expect(result).toMatchObject({
      status: 400,
      body: {
        error: {
          code: 'INVALID_QUERY',
          message: '잘못된 요청입니다.',
          details: [{ field: 'q', reason: '테스트 오류' }],
        },
        meta: {
          request_id: expect.stringMatching(/^req_/),
        },
      },
    });
  });
});

describe('bean finder api layer', () => {
  it('returns home metadata', () => {
    const result = expectSuccess(getHomeApi());

    expect(result.body.data.suggested_queries).toContain('신맛 적은 원두');
    expect(result.body.data.featured_categories.length).toBeGreaterThan(0);
    expect(result.body.data.featured_rankings.length).toBeGreaterThan(0);
    expect(result.body.meta.request_id).toMatch(/^req_/);
  });

  it('searches beans with pagination and query meta', () => {
    const result = expectSuccess<BeanCard[]>(
      getBeansSearchApi({
        q: '라떼 원두',
        sort: 'price_per_100g_asc',
        page: 1,
        limit: 5,
      }),
    );

    expect(result.body.data.length).toBeGreaterThan(0);
    expect(result.body.data.length).toBeLessThanOrEqual(5);
    expect(
      result.body.data.every((bean) =>
        bean.recommended_brew_methods.some(
          (method) => method.key === 'latte' || method.key === 'espresso',
        ),
      ),
    ).toBe(true);
    expect(result.body.meta).toMatchObject({
      query: {
        q: '라떼 원두',
        sort: 'price_per_100g_asc',
      },
      pagination: {
        page: 1,
        limit: 5,
      },
    });
  });

  it('returns available beans for an empty search query', () => {
    const availableCount = loadBeanData().beans.filter(
      (bean) => bean.flags.is_available,
    ).length;
    const result = expectSuccess<BeanCard[]>(getBeansSearchApi({ limit: 50 }));

    expect(result.body.data).toHaveLength(availableCount);
    expect(result.body.data.every((bean) => bean.is_available)).toBe(true);
    expect(result.body.meta.pagination).toMatchObject({
      page: 1,
      limit: 50,
      total_count: availableCount,
    });
  });

  it('applies search API filters for acidity, body, price, and 100g price sort', () => {
    const lowAcidity = expectSuccess<BeanCard[]>(
      getBeansSearchApi({ acidity: 'low', limit: 50 }),
    );
    const heavyBody = expectSuccess<BeanCard[]>(
      getBeansSearchApi({ body: 'heavy', limit: 50 }),
    );
    const under20000 = expectSuccess<BeanCard[]>(
      getBeansSearchApi({ price_max: 20000, limit: 50 }),
    );
    const valueSorted = expectSuccess<BeanCard[]>(
      getBeansSearchApi({ sort: 'price_per_100g_asc', limit: 50 }),
    );

    expect(
      lowAcidity.body.data.every(
        (bean) => bean.taste_summary.acidity.score <= 2,
      ),
    ).toBe(true);
    expect(
      heavyBody.body.data.every((bean) => bean.taste_summary.body.score >= 4),
    ).toBe(true);
    expect(under20000.body.data.every((bean) => bean.price <= 20000)).toBe(
      true,
    );
    expect(isSortedAscending(valueSorted.body.data, 'price_per_100g')).toBe(
      true,
    );
  });

  it('returns invalid query error for unsupported enum values', () => {
    const result = expectFailure(
      getBeansSearchApi({ acidity: 'very_high' }),
      400,
    );

    expect(result.body.error.code).toBe('INVALID_QUERY');
    expect(result.body.error.details?.[0].field).toBe('acidity');
  });

  it('returns invalid query error for reversed 100g price range', () => {
    const result = expectFailure(
      getBeansSearchApi({
        price_per_100g_min: 10000,
        price_per_100g_max: 5000,
      }),
      400,
    );

    expect(result.body.error.details?.[0]).toMatchObject({
      field: 'price_per_100g_min',
    });
  });

  it('returns bean detail by id or slug', () => {
    const byId = expectSuccess(getBeanDetailApi('bean_fritz_daily_blend_001'));
    const bySlug = expectSuccess(getBeanDetailApi('fritz-daily-blend'));

    expect(byId.body.data.id).toBe('bean_fritz_daily_blend_001');
    expect(bySlug.body.data.id).toBe('bean_fritz_daily_blend_001');
    expect(byId.body.data).toMatchObject({
      roastery: {
        id: 'roastery_fritz',
      },
      package: {
        price: 18000,
        price_per_100g: 9000,
      },
      source: {
        last_checked_at: '2026-05-08',
      },
    });
  });

  it('returns not found for unknown bean detail', () => {
    const result = expectFailure(getBeanDetailApi('missing-bean'), 404);

    expect(result.body.error.code).toBe('NOT_FOUND');
  });

  it('returns batch beans in requested order with missing ids metadata', () => {
    const result = expectSuccess(
      getBeansBatchApi({
        ids: 'bean_fritz_daily_blend_001,missing,bean_fritz_brazil_nut_001',
      }),
    );

    expect(result.body.data.map((bean) => bean.id)).toEqual([
      'bean_fritz_daily_blend_001',
      'bean_fritz_brazil_nut_001',
    ]);
    expect(result.body.meta.missing_ids).toEqual(['missing']);
    expect(result.body.data[0]).toHaveProperty('taste_profile');
    expect(result.body.data[0]).not.toHaveProperty('taste_summary');
  });

  it('returns one batch bean and rejects requests without ids', () => {
    const single = expectSuccess(
      getBeansBatchApi({ ids: 'bean_fritz_daily_blend_001' }),
    );
    const missing = expectFailure(getBeansBatchApi({}), 400);

    expect(single.body.data).toHaveLength(1);
    expect(single.body.data[0].id).toBe('bean_fritz_daily_blend_001');
    expect(missing.body.error.details?.[0].field).toBe('ids');
  });

  it('rejects batch requests over four ids', () => {
    const result = expectFailure(
      getBeansBatchApi({
        ids: 'bean_a,bean_b,bean_c,bean_d,bean_e',
      }),
      400,
    );

    expect(result.body.error.details?.[0].field).toBe('ids');
  });

  it('returns similar beans and excludes the base bean', () => {
    const result = expectSuccess<BeanCard[]>(
      getBeanSimilarApi('bean_fritz_daily_blend_001', { limit: 4 }),
    );

    expect(result.body.data).toHaveLength(4);
    expect(
      result.body.data.every(
        (bean) => bean.id !== 'bean_fritz_daily_blend_001',
      ),
    ).toBe(true);
    expect(result.body.meta.base_bean_id).toBe('bean_fritz_daily_blend_001');
  });

  it('returns not found for unknown similar base bean', () => {
    const result = expectFailure(getBeanSimilarApi('missing-bean'), 404);

    expect(result.body.error.code).toBe('NOT_FOUND');
  });

  it('returns active categories ordered by display order', () => {
    const result = expectSuccess(getCategoriesApi());

    expect(result.body.data.length).toBeGreaterThan(0);
    expect(result.body.data[0]).toMatchObject({
      key: 'low-acidity',
      default_filters: { acidity: 'low' },
      default_sort: 'recommended',
      display_order: 1,
    });
  });

  it('returns category beans using category filters and pagination', () => {
    const result = expectSuccess<BeanCard[]>(
      getCategoryBeansApi('latte', { limit: 5 }),
    );

    expect(result.body.data.length).toBeGreaterThan(0);
    expect(result.body.data.length).toBeLessThanOrEqual(5);
    expect(
      result.body.data.every((bean) =>
        bean.recommended_brew_methods.some(
          (method) => method.key === 'latte' || method.key === 'espresso',
        ),
      ),
    ).toBe(true);
    expect(result.body.meta.category).toMatchObject({
      key: 'latte',
      default_filters: { brew_method: ['latte', 'espresso'] },
    });
    expect(result.body.meta.pagination).toMatchObject({
      page: 1,
      limit: 5,
    });
  });

  it('keeps category filters when applying an explicit sort', () => {
    const result = expectSuccess<BeanCard[]>(
      getCategoryBeansApi('low-acidity', { sort: 'price_asc', limit: 50 }),
    );

    expect(result.body.data.length).toBeGreaterThan(0);
    expect(
      result.body.data.every((bean) => bean.taste_summary.acidity.score <= 2),
    ).toBe(true);
    expect(isSortedAscending(result.body.data, 'price')).toBe(true);
  });

  it('returns not found for unknown category beans', () => {
    const result = expectFailure(getCategoryBeansApi('missing-category'), 404);

    expect(result.body.error.code).toBe('NOT_FOUND');
  });

  it('returns active rankings ordered by display order', () => {
    const result = expectSuccess(getRankingsApi());

    expect(result.body.data.length).toBeGreaterThan(0);
    expect(result.body.data[0]).toMatchObject({
      key: 'price-per-100g',
      display_order: 1,
    });
  });

  it('returns ranking beans with rank and criteria metadata', () => {
    const result = expectSuccess(
      getRankingBeansApi('price-per-100g', { limit: 5 }),
    );

    expect(result.body.data).toHaveLength(5);
    expect(result.body.data.map((item) => item.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(result.body.data[0].bean.price_per_100g).toBeLessThanOrEqual(
      result.body.data[1].bean.price_per_100g,
    );
    expect(result.body.meta.ranking).toMatchObject({
      key: 'price-per-100g',
      criteria: 'price_per_100g 오름차순',
    });
  });

  it('returns latte ranking beans and unknown ranking errors', () => {
    const latte = expectSuccess(getRankingBeansApi('latte', { limit: 10 }));
    const missing = expectFailure(getRankingBeansApi('missing-ranking'), 404);

    expect(latte.body.data.length).toBeGreaterThan(0);
    expect(
      latte.body.data.every((item) =>
        item.bean.recommended_brew_methods.some(
          (method) => method.key === 'latte' || method.key === 'espresso',
        ),
      ),
    ).toBe(true);
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects ranking bean limit over fifty', () => {
    const result = expectFailure(
      getRankingBeansApi('price-per-100g', { limit: 51 }),
      400,
    );

    expect(result.body.error.details?.[0].field).toBe('limit');
  });

  it('returns filter options with null counts', () => {
    const result = expectSuccess(getFilterOptionsApi({ q: '라떼' }));

    expect(result.body.data.price_ranges).toContainEqual({
      key: 'under_10000',
      label: '1만원 이하',
      count: null,
    });
    expect(result.body.data.brew_methods).toContainEqual({
      key: 'hand_drip',
      label: '핸드드립',
      count: null,
    });
    expect(result.body.data.origins.length).toBeGreaterThan(0);
    expect(result.body.data.tasting_notes[0]).toHaveProperty('group');
  });

  it('accepts allowed events and rejects unknown event names', () => {
    const accepted = expectSuccess(
      postEventApi({
        event_name: 'search_submitted',
        occurred_at: '2026-05-08T12:00:00+09:00',
        page_path: '/search',
        properties: {
          query: '라떼',
        },
      }),
    );
    const rejected = expectFailure(
      postEventApi({
        event_name: 'unknown_event',
        occurred_at: '2026-05-08T12:00:00+09:00',
        page_path: '/search',
      }),
      400,
    );

    expect(accepted.body.data).toEqual({ accepted: true });
    expect(rejected.body.error.code).toBe('INVALID_BODY');
    expect(rejected.body.error.details?.[0].field).toBe('event_name');
  });

  it('accepts events without properties and rejects missing event names', () => {
    const accepted = expectSuccess(
      postEventApi({
        event_name: 'outbound_clicked',
        occurred_at: '2026-05-08T12:00:00+09:00',
        page_path: '/beans/fritz-daily-blend',
      }),
    );
    const rejected = expectFailure(
      postEventApi({
        occurred_at: '2026-05-08T12:00:00+09:00',
        page_path: '/search',
      }),
      400,
    );

    expect(accepted.body.data).toEqual({ accepted: true });
    expect(rejected.body.error.details?.[0].field).toBe('event_name');
  });

  it('validates internal bean payloads without saving data', () => {
    const sampleBean = loadBeanData().beans[0];
    const validBean = {
      ...sampleBean,
      primary_package: {
        ...sampleBean.primary_package,
      },
    };
    const invalidBean = {
      ...validBean,
      id: 'bean_invalid_validation_sample',
      primary_package: {
        ...validBean.primary_package,
        currency: undefined,
      },
    };
    const result = expectSuccess(
      postInternalBeansValidateApi({
        beans: [validBean, invalidBean],
      }),
    );

    expect(result.body.data.valid).toBe(false);
    expect(result.body.data.summary).toMatchObject({
      total: 2,
      valid_count: 1,
      invalid_count: 1,
    });
    expect(result.body.data.results[0]).toMatchObject({
      id: validBean.id,
      valid: true,
      computed: {
        price_per_100g: validBean.primary_package.price_per_100g,
      },
    });
    expect(result.body.data.results[1].errors[0].field).toBe(
      'primary_package.currency',
    );
  });

  it('rejects internal validation requests without a beans array', () => {
    const result = expectFailure(postInternalBeansValidateApi({}), 400);

    expect(result.body.error.code).toBe('INVALID_BODY');
    expect(result.body.error.details?.[0].field).toBe('beans');
  });
});

function isSortedAscending<TItem, TKey extends keyof TItem>(
  items: TItem[],
  key: TKey,
) {
  return items.every((item, index) => {
    const previous = items[index - 1];
    return !previous || Number(previous[key]) <= Number(item[key]);
  });
}
