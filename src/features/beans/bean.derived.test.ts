import { describe, expect, it } from 'vitest';
import { calculatePricePer100g, createEasyTasteTags } from './bean.derived';
import { loadBeanData } from './bean.repository';

const data = loadBeanData();

describe('bean derived values', () => {
  it.each([
    [18000, 200, 9000],
    [12000, 250, 4800],
    [19900, 250, 7960],
  ])('calculates price per 100g for %iw / %ig', (price, weight, expected) => {
    expect(calculatePricePer100g(price, weight)).toBe(expected);
  });

  it('rejects non-positive price or weight values', () => {
    expect(() => calculatePricePer100g(0, 200)).toThrow(
      'price must be greater than 0',
    );
    expect(() => calculatePricePer100g(10000, 0)).toThrow(
      'weight_g must be greater than 0',
    );
  });

  it('maps score, roast, note, and brew method rules to easy taste tags', () => {
    const bean = structuredClone(data.beans[0]);

    bean.taste_profile.acidity = 2;
    bean.taste_profile.sweetness = 5;
    bean.taste_profile.bitterness = 2;
    bean.taste_profile.body = 4;
    bean.roast_level = 'dark';
    bean.tasting_notes = ['chocolate', 'cacao', 'smoky'];
    bean.recommended_brew_methods = ['latte', 'hand_drip'];

    const tags = createEasyTasteTags(bean, data.tastingNotes);

    expect(tags).toEqual(
      expect.arrayContaining([
        '신맛 적음',
        '묵직함',
        '쓴맛 적음',
        '단맛 좋음',
        '진하고 쌉쌀함',
        '라떼용',
        '핸드드립용',
        '초콜릿 느낌',
      ]),
    );
    expect(tags.filter((tag) => tag === '초콜릿 느낌')).toHaveLength(1);
    expect(tags.filter((tag) => tag === '진하고 쌉쌀함')).toHaveLength(1);
  });
});
