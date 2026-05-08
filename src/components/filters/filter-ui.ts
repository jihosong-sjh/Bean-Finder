import type { SortKey } from '../../features/beans/bean.search';

export const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: 'recommended', label: '추천순' },
  { key: 'price_asc', label: '가격 낮은 순' },
  { key: 'price_per_100g_asc', label: '100g당 가격 낮은 순' },
  { key: 'rating_desc', label: '평점 높은 순' },
  { key: 'review_count_desc', label: '리뷰 많은 순' },
  { key: 'acidity_desc', label: '산미 강한 순' },
  { key: 'body_desc', label: '바디감 강한 순' },
  { key: 'newest', label: '최신 등록순' },
];

export const filterParamLabels: Record<string, string> = {
  price_range: '가격대',
  price_min: '최소 가격',
  price_max: '최대 가격',
  price_per_100g_min: '100g당 최소',
  price_per_100g_max: '100g당 최대',
  acidity: '산미',
  body: '바디감',
  roast_level: '로스팅',
  origin_country: '원산지',
  tasting_notes: '컵노트',
  brew_method: '추출',
  is_decaf: '디카페인',
  availability: '판매 상태',
};

export const filterParamKeys = Object.keys(filterParamLabels);

export function splitParamValue(value: string | null) {
  return value ? value.split(',').filter(Boolean) : [];
}

export function joinParamValues(values: string[]) {
  return values.filter(Boolean).join(',');
}
