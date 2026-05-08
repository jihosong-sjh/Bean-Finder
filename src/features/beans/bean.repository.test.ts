import { describe, expect, it } from 'vitest';
import { calculatePricePer100g } from './bean.derived';
import { loadBeanData } from './bean.repository';
import { beanInputSchema } from './bean.validation';

describe('bean data repository', () => {
  it('loads sample data and enriches every bean', () => {
    const data = loadBeanData();

    expect(data.beans).toHaveLength(30);
    expect(data.roasteries).toHaveLength(5);
    expect(data.tastingNotes.length).toBeGreaterThan(0);

    for (const bean of data.beans) {
      expect(bean.primary_package.price_per_100g).toBe(
        calculatePricePer100g(
          bean.primary_package.price,
          bean.primary_package.weight_g,
        ),
      );
      expect(bean.easy_taste_tags.length).toBeGreaterThan(0);
      expect(bean.search_text).toContain(bean.name.toLowerCase());
    }
  });

  it('creates easy taste tags from score, roast, brew method, and notes', () => {
    const { beans } = loadBeanData();
    const latteBean = beans.find(
      (bean) => bean.id === 'bean_center_signature_latte_001',
    );

    expect(latteBean?.easy_taste_tags).toEqual(
      expect.arrayContaining(['신맛 적음', '묵직함', '라떼용', '초콜릿 느낌']),
    );
  });

  it('rejects missing required fields', () => {
    const { beans } = loadBeanData();
    const invalidBean = { ...beans[0], id: undefined };

    expect(() => beanInputSchema.parse(invalidBean)).toThrow();
  });
});
