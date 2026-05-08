import { describe, expect, it } from 'vitest';
import { loadBeanData } from './bean.repository';
import {
  applyBeanFilters,
  calculateRankingBeans,
  calculateRecommendationScore,
  calculateSimilarBeans,
  calculateTextSearchScore,
  mapBeanToCard,
  mapEasySearchQueryToFilters,
  mergeCategoryFilters,
  normalizeSearchQuery,
  paginateItems,
  searchBeans,
  sortBeans,
} from './bean.search';

const data = loadBeanData();
const context = {
  roasteries: data.roasteries,
  tastingNotes: data.tastingNotes,
};

describe('bean search domain', () => {
  it('normalizes search query text', () => {
    expect(normalizeSearchQuery('  LATTE   원두!!  ')).toBe('latte 원두');
  });

  it('maps easy search terms to filters', () => {
    expect(mapEasySearchQueryToFilters('신맛 적은 원두')).toMatchObject({
      acidity: 'low',
    });
    expect(mapEasySearchQueryToFilters('라떼 원두')).toMatchObject({
      brew_method: ['latte', 'espresso'],
    });
    expect(mapEasySearchQueryToFilters('2만원 이하 원두')).toMatchObject({
      price_max: 20000,
    });
  });

  it('calculates text search score by weighted fields', () => {
    const bean = data.beans.find(
      (item) => item.id === 'bean_fritz_daily_blend_001',
    );

    expect(bean).toBeDefined();

    const nameScore = calculateTextSearchScore(bean!, '데일리 블렌드', context);
    const brewScore = calculateTextSearchScore(bean!, '라떼', context);

    expect(nameScore).toBeGreaterThanOrEqual(100);
    expect(brewScore).toBeGreaterThan(0);
  });

  it('searches low acidity query with low acidity beans first', () => {
    const result = searchBeans(
      data.beans,
      { query: '신맛 적은 원두', limit: 5 },
      context,
    );

    expect(result.items.length).toBeGreaterThan(0);
    expect(
      result.items.every((item) => item.taste_summary.acidity.score <= 2),
    ).toBe(true);
  });

  it('searches latte query with latte or espresso beans first', () => {
    const result = searchBeans(
      data.beans,
      { query: '라떼 원두', limit: 5 },
      context,
    );

    expect(result.items.length).toBeGreaterThan(0);
    expect(
      result.items.every((item) =>
        item.recommended_brew_methods.some(
          (method) => method.key === 'latte' || method.key === 'espresso',
        ),
      ),
    ).toBe(true);
  });

  it('searches price intent query as a structured condition', () => {
    const result = searchBeans(
      data.beans,
      { query: '2만원 이하 원두', limit: 30 },
      context,
    );

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((item) => item.price <= 20000)).toBe(true);
  });

  it('filters with AND between groups and OR inside a group', () => {
    const filtered = applyBeanFilters(
      data.beans,
      {
        acidity: 'low',
        body: 'heavy',
        brew_method: ['latte', 'espresso'],
      },
      context,
    );

    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every(
        (bean) =>
          bean.taste_profile.acidity <= 2 &&
          bean.taste_profile.body >= 4 &&
          bean.recommended_brew_methods.some(
            (method) => method === 'latte' || method === 'espresso',
          ),
      ),
    ).toBe(true);
  });

  it('filters by price range and tasting note group', () => {
    const filtered = applyBeanFilters(
      data.beans,
      {
        price_range: '10000_20000',
        tasting_note_groups: 'nut',
      },
      context,
    );

    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every(
        (bean) =>
          bean.primary_package.price > 10000 &&
          bean.primary_package.price <= 20000,
      ),
    ).toBe(true);
  });

  it('sorts by price_per_100g ascending', () => {
    const sorted = sortBeans(data.beans, 'price_per_100g_asc');

    expect(
      sorted.every((bean, index) => {
        const previous = sorted[index - 1];
        return (
          !previous ||
          previous.primary_package.price_per_100g <=
            bean.primary_package.price_per_100g
        );
      }),
    ).toBe(true);
  });

  it('calculates recommendation score with fallback formula when ratings are missing', () => {
    const beanWithoutRating = data.beans.find(
      (bean) => bean.rating.average === null && bean.rating.count === null,
    );

    expect(beanWithoutRating).toBeDefined();

    const score = calculateRecommendationScore(beanWithoutRating!, {
      beans: data.beans,
      filters: { brew_method: 'hand_drip' },
    });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('paginates items with API metadata shape', () => {
    const result = paginateItems(data.beans, { page: 2, limit: 7 });

    expect(result.items).toHaveLength(7);
    expect(result.pagination).toMatchObject({
      page: 2,
      limit: 7,
      total_count: data.beans.length,
      has_next: true,
      has_prev: true,
    });
  });

  it('maps a bean to BeanCard fields', () => {
    const card = mapBeanToCard(data.beans[0], context);

    expect(card).toMatchObject({
      id: data.beans[0].id,
      roastery: {
        id: data.beans[0].roastery_id,
      },
      price: data.beans[0].primary_package.price,
      price_per_100g: data.beans[0].primary_package.price_per_100g,
    });
    expect(card.tasting_notes.length).toBeLessThanOrEqual(3);
    expect(card.recommended_brew_methods.length).toBeLessThanOrEqual(2);
  });

  it('merges category filters with additional filters', () => {
    const category = data.categories.find((item) => item.key === 'latte');

    expect(category).toBeDefined();

    const merged = mergeCategoryFilters(category!.default_filters, {
      brew_method: 'hand_drip',
      price_max: 18000,
    });

    expect(merged.brew_method).toEqual(['latte', 'espresso', 'hand_drip']);
    expect(merged.price_max).toBe(18000);
  });

  it('calculates ranking beans by ranking filters and sort', () => {
    const ranking = data.rankings.find((item) => item.key === 'price-per-100g');

    expect(ranking).toBeDefined();

    const beans = calculateRankingBeans(data.beans, ranking!, context);

    expect(beans.length).toBeGreaterThan(0);
    expect(
      beans.every((bean, index) => {
        const previous = beans[index - 1];
        return (
          !previous ||
          previous.primary_package.price_per_100g <=
            bean.primary_package.price_per_100g
        );
      }),
    ).toBe(true);
  });

  it('calculates similar beans and excludes the target bean', () => {
    const similarBeans = calculateSimilarBeans(
      data.beans,
      'bean_fritz_daily_blend_001',
      { limit: 4 },
    );

    expect(similarBeans).toHaveLength(4);
    expect(
      similarBeans.every(
        (item) => item.bean.id !== 'bean_fritz_daily_blend_001',
      ),
    ).toBe(true);
    expect(
      similarBeans.every((item, index) => {
        const previous = similarBeans[index - 1];
        return !previous || previous.similarity_score >= item.similarity_score;
      }),
    ).toBe(true);
  });
});
