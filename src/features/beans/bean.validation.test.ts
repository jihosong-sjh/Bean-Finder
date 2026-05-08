import { describe, expect, it } from 'vitest';
import { postInternalBeansValidateApi } from '../../api/bean-finder.api';
import { loadBeanData } from './bean.repository';
import type { Bean } from './bean.types';

const sampleBean = loadBeanData().beans[0];

describe('bean data validation', () => {
  it('rejects missing fields, invalid references, enum values, scores, URLs, and future dates', () => {
    const result = validateBeans([
      makeRawBean('missing_id', (bean) => {
        delete (bean as Partial<Bean>).id;
      }),
      makeRawBean('unknown_roastery', (bean) => {
        bean.roastery_id = 'roastery_missing';
      }),
      makeRawBean('empty_tasting_notes', (bean) => {
        bean.tasting_notes = [];
      }),
      makeRawBean('empty_brew_methods', (bean) => {
        bean.recommended_brew_methods = [];
      }),
      makeRawBean('invalid_url', (bean) => {
        bean.primary_package.product_url = 'not-a-url';
      }),
      makeRawBean('invalid_roast', (bean) => {
        bean.roast_level = 'burnt' as Bean['roast_level'];
      }),
      makeRawBean('invalid_score', (bean) => {
        bean.taste_profile.acidity = 0 as Bean['taste_profile']['acidity'];
      }),
      makeRawBean('future_checked_at', (bean) => {
        bean.source.last_checked_at = '2999-01-01';
      }),
    ]);

    expect(result.valid).toBe(false);
    expect(result.summary).toMatchObject({
      total: 8,
      valid_count: 0,
      invalid_count: 8,
    });
    expect(flattenErrorFields(result.results)).toEqual(
      expect.arrayContaining([
        'id',
        'roastery_id',
        'tasting_notes',
        'recommended_brew_methods',
        'primary_package.product_url',
        'roast_level',
        'taste_profile.acidity',
        'source.last_checked_at',
      ]),
    );
  });

  it('computes derived price values and warns when source checks are stale', () => {
    const bean = makeRawBean('stale_source', (item) => {
      item.primary_package.price = 18000;
      item.primary_package.weight_g = 200;
      item.source.last_checked_at = '2025-01-01';
    });
    const result = validateBeans([bean]);

    expect(result.valid).toBe(true);
    expect(result.summary).toMatchObject({
      total: 1,
      valid_count: 1,
      invalid_count: 0,
      warning_count: 1,
    });
    expect(result.results[0]).toMatchObject({
      id: 'bean_m7_stale_source',
      computed: {
        price_per_100g: 9000,
      },
      warnings: [
        {
          field: 'source.last_checked_at',
        },
      ],
    });
  });
});

function makeRawBean(idSuffix: string, edit?: (bean: Bean) => void) {
  const bean = structuredClone(sampleBean);

  bean.id = `bean_m7_${idSuffix}`;
  bean.slug = `m7-${idSuffix.replace(/_/g, '-')}`;
  edit?.(bean);

  return bean;
}

function validateBeans(beans: unknown[]) {
  const response = postInternalBeansValidateApi({ beans });

  expect(response.status).toBe(200);
  expect('data' in response.body).toBe(true);

  if (!('data' in response.body)) {
    throw new Error('Expected validation success response');
  }

  return response.body.data;
}

function flattenErrorFields(
  results: ReturnType<typeof validateBeans>['results'],
) {
  return results.flatMap((result) => result.errors.map((error) => error.field));
}
