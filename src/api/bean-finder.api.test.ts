import { describe, expect, it } from 'vitest';
import {
  getBeanDetailApi,
  getBeansBatchApi,
  getBeansSearchApi,
  getBeanSimilarApi,
  getHomeApi,
} from './bean-finder.api';
import type { ApiFailure, ApiSuccess } from './api.response';
import { apiError, apiSuccess } from './api.response';
import type { BeanCard } from '../features/beans/bean.search';

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
});
