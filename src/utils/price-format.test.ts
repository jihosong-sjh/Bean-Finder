import { describe, expect, it } from 'vitest';
import { formatPrice, formatPricePer100g, formatWeight } from './price-format';

describe('price formatters', () => {
  it('formats KRW price, weight, and unit price labels', () => {
    expect(formatPrice(18000)).toBe('18,000원');
    expect(formatWeight(200)).toBe('200g');
    expect(formatPricePer100g(9000)).toBe('100g당 9,000원');
  });

  it('returns fallback labels for missing values', () => {
    expect(formatPrice(null)).toBe('정보 없음');
    expect(formatWeight(undefined)).toBe('정보 없음');
    expect(formatPricePer100g(null)).toBe('100g당 정보 없음');
  });
});
