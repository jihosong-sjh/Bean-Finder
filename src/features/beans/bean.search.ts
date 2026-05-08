import type {
  Bean,
  BrewMethod,
  RoastLevel,
  Score,
  TastingNoteGroup,
} from './bean.types';
import { normalizeSearchText } from './bean.derived';
import type { CategoryFilter } from '../categories/category.types';
import type { Ranking, RankingFilter } from '../rankings/ranking.types';
import type { Roastery } from '../roasteries/roastery.types';
import type { TastingNote } from '../tasting-notes/tasting-note.types';

export type PriceRange =
  | 'under_10000'
  | '10000_20000'
  | '20000_30000'
  | 'over_30000';

export type AvailabilityFilter = 'available_only' | 'include_sold_out';

export type SortKey =
  | 'recommended'
  | 'price_asc'
  | 'price_per_100g_asc'
  | 'rating_desc'
  | 'review_count_desc'
  | 'acidity_desc'
  | 'body_desc'
  | 'newest';

export type SearchFilters = {
  price_range?: PriceRange | PriceRange[];
  price_per_100g_min?: number;
  price_per_100g_max?: number;
  price_max?: number;
  acidity?: 'low' | 'medium' | 'high' | Array<'low' | 'medium' | 'high'>;
  acidity_max?: number;
  body?: 'light' | 'medium' | 'heavy' | Array<'light' | 'medium' | 'heavy'>;
  bitterness_max?: number;
  roast_level?: RoastLevel | RoastLevel[];
  origin_country?: string | string[];
  tasting_notes?: string | string[];
  tasting_note_groups?: TastingNoteGroup | TastingNoteGroup[];
  brew_method?: BrewMethod | BrewMethod[];
  is_decaf?: boolean;
  is_available?: boolean;
  availability?: AvailabilityFilter;
  price_per_100g_percentile?: 'bottom_30';
};

export type BeanSearchContext = {
  roasteries: Roastery[];
  tastingNotes: TastingNote[];
};

export type PaginationInput = {
  page?: number;
  limit?: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

export type BeanCard = {
  id: string;
  slug: string;
  name: string;
  roastery: {
    id: string;
    name: string;
  };
  origin: {
    country: string;
    region: string | null;
  };
  roast_level: {
    key: RoastLevel;
    label: string;
  };
  price: number;
  weight_g: number;
  price_per_100g: number;
  currency: 'KRW';
  taste_summary: {
    acidity: {
      score: Score;
      label: string;
    };
    body: {
      score: Score;
      label: string;
    };
  };
  tasting_notes: Array<{
    key: string;
    label: string;
  }>;
  easy_taste_tags: string[];
  recommended_brew_methods: Array<{
    key: BrewMethod;
    label: string;
  }>;
  image_url: string | null;
  image_alt: string | null;
  is_decaf: boolean;
  is_available: boolean;
  product_url: string;
};

export type SearchResult = {
  items: BeanCard[];
  pagination: PaginationMeta;
  total_count: number;
};

export type ScoredBean = {
  bean: Bean;
  score: number;
};

export type SimilarBean = {
  bean: Bean;
  similarity_score: number;
};

const MAX_QUERY_LENGTH = 100;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const roastLevelLabels: Record<RoastLevel, string> = {
  light: '라이트',
  medium: '미디엄',
  medium_dark: '미디엄 다크',
  dark: '다크',
};

const brewMethodLabels: Record<BrewMethod, string> = {
  hand_drip: '핸드드립',
  espresso: '에스프레소',
  latte: '라떼',
  cold_brew: '콜드브루',
  moka_pot: '모카포트',
  french_press: '프렌치프레스',
};

const roastSearchLabels: Record<RoastLevel, string[]> = {
  light: ['light', '라이트', '약배전'],
  medium: ['medium', '미디엄', '중배전'],
  medium_dark: ['medium dark', '미디엄 다크', '중강배전'],
  dark: ['dark', '다크', '강배전', '다크로스팅'],
};

const brewSearchLabels: Record<BrewMethod, string[]> = {
  hand_drip: ['hand drip', 'hand_drip', '핸드드립', '드립'],
  espresso: ['espresso', '에스프레소'],
  latte: ['latte', '라떼'],
  cold_brew: ['cold brew', 'cold_brew', '콜드브루'],
  moka_pot: ['moka pot', 'moka_pot', '모카포트'],
  french_press: ['french press', 'french_press', '프렌치프레스'],
};

export function normalizeSearchQuery(query: string) {
  return normalizeSearchText(query).slice(0, MAX_QUERY_LENGTH);
}

export function mapEasySearchQueryToFilters(query: string): SearchFilters {
  const normalizedQuery = normalizeSearchQuery(query);
  const filters: SearchFilters = {};

  if (
    containsAny(normalizedQuery, ['신맛 적은', '신맛 낮', '산미 낮', '산미 적'])
  ) {
    filters.acidity = 'low';
  }

  if (containsAny(normalizedQuery, ['산미 있는', '산미 강', '상큼한'])) {
    filters.acidity = 'high';
  }

  if (containsAny(normalizedQuery, ['묵직한', '바디감 있는', '바디감 강'])) {
    filters.body = 'heavy';
  }

  if (containsAny(normalizedQuery, ['고소한', '고소함', '너티', '견과'])) {
    filters.tasting_note_groups = 'nut';
  }

  if (normalizedQuery.includes('초콜릿')) {
    filters.tasting_note_groups = 'chocolate';
  }

  if (normalizedQuery.includes('라떼')) {
    filters.brew_method = ['latte', 'espresso'];
  }

  const priceMax = parsePriceMax(query);
  if (priceMax !== null) {
    filters.price_max = priceMax;
  }

  return filters;
}

export function calculateTextSearchScore(
  bean: Bean,
  query: string,
  context: BeanSearchContext,
) {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return 0;
  }

  const tokens = normalizedQuery
    .split(' ')
    .filter(
      (token) => token.length > 0 && token !== '원두' && token !== '좋은',
    );
  const roastery = getRoastery(bean, context.roasteries);
  const noteFields = getTastingNoteSearchFields(bean, context.tastingNotes);
  const fields = [
    { weight: 100, values: [bean.name, bean.slug] },
    { weight: 90, values: [roastery?.name, roastery?.name_en] },
    { weight: 70, values: noteFields },
    { weight: 65, values: bean.easy_taste_tags },
    {
      weight: 55,
      values: [
        bean.origin.country,
        bean.origin.country_code,
        bean.origin.region,
        bean.origin.farm,
        bean.origin.producer,
      ],
    },
    {
      weight: 50,
      values: bean.recommended_brew_methods.flatMap(
        (method) => brewSearchLabels[method],
      ),
    },
    { weight: 40, values: roastSearchLabels[bean.roast_level] },
  ];

  let score = 0;

  for (const field of fields) {
    const normalizedValues = field.values
      .filter((value): value is string => Boolean(value))
      .map(normalizeSearchText);

    if (normalizedValues.some((value) => value.includes(normalizedQuery))) {
      score += field.weight;
      continue;
    }

    const matchedTokenCount = tokens.filter((token) =>
      normalizedValues.some((value) => value.includes(token)),
    ).length;

    if (matchedTokenCount > 0) {
      score += Math.round(field.weight * (matchedTokenCount / tokens.length));
    }
  }

  if (bean.search_text.includes(normalizedQuery)) {
    score += 20;
  } else {
    const matchedSearchTextTokens = tokens.filter((token) =>
      bean.search_text.includes(token),
    ).length;

    if (matchedSearchTextTokens > 0) {
      score += Math.round(20 * (matchedSearchTextTokens / tokens.length));
    }
  }

  return score;
}

export function applyBeanFilters(
  beans: Bean[],
  filters: SearchFilters | CategoryFilter | RankingFilter = {},
  context?: Partial<BeanSearchContext>,
) {
  const normalizedFilters = filters as SearchFilters;
  const pricePer100gMax = getPricePer100gPercentileMax(
    beans,
    normalizedFilters,
  );

  return beans.filter((bean) => {
    if (
      normalizedFilters.is_available !== undefined &&
      bean.flags.is_available !== normalizedFilters.is_available
    ) {
      return false;
    }

    if (
      normalizedFilters.is_available === undefined &&
      normalizedFilters.availability !== 'include_sold_out' &&
      !bean.flags.is_available
    ) {
      return false;
    }

    if (
      normalizedFilters.is_decaf !== undefined &&
      bean.flags.is_decaf !== normalizedFilters.is_decaf
    ) {
      return false;
    }

    if (!matchesPriceRange(bean, normalizedFilters.price_range)) {
      return false;
    }

    if (
      normalizedFilters.price_max !== undefined &&
      bean.primary_package.price > normalizedFilters.price_max
    ) {
      return false;
    }

    if (
      normalizedFilters.price_per_100g_min !== undefined &&
      bean.primary_package.price_per_100g < normalizedFilters.price_per_100g_min
    ) {
      return false;
    }

    if (
      normalizedFilters.price_per_100g_max !== undefined &&
      bean.primary_package.price_per_100g > normalizedFilters.price_per_100g_max
    ) {
      return false;
    }

    if (
      pricePer100gMax !== null &&
      bean.primary_package.price_per_100g > pricePer100gMax
    ) {
      return false;
    }

    if (
      !matchesAcidity(bean.taste_profile.acidity, normalizedFilters.acidity)
    ) {
      return false;
    }

    if (
      normalizedFilters.acidity_max !== undefined &&
      bean.taste_profile.acidity > normalizedFilters.acidity_max
    ) {
      return false;
    }

    if (!matchesBody(bean.taste_profile.body, normalizedFilters.body)) {
      return false;
    }

    if (
      normalizedFilters.bitterness_max !== undefined &&
      bean.taste_profile.bitterness > normalizedFilters.bitterness_max
    ) {
      return false;
    }

    if (!matchesAny(bean.roast_level, normalizedFilters.roast_level)) {
      return false;
    }

    if (!matchesOriginCountry(bean, normalizedFilters.origin_country)) {
      return false;
    }

    if (!matchesTastingNotes(bean, normalizedFilters.tasting_notes)) {
      return false;
    }

    if (
      !matchesTastingNoteGroups(
        bean,
        normalizedFilters.tasting_note_groups,
        context?.tastingNotes ?? [],
      )
    ) {
      return false;
    }

    if (!matchesBrewMethod(bean, normalizedFilters.brew_method)) {
      return false;
    }

    return true;
  });
}

export function calculateRecommendationScore(
  bean: Bean,
  options: {
    beans?: Bean[];
    query?: string;
    filters?: SearchFilters;
    textScore?: number;
    context?: BeanSearchContext;
  } = {},
) {
  const tasteMatchScore = calculateTasteMatchScore(bean, options);
  const priceFitScore = calculatePriceFitScore(bean, options.beans ?? [bean]);
  const ratingScore =
    bean.rating.average === null ? null : (bean.rating.average / 5) * 100;
  const reviewCountScore =
    bean.rating.count === null
      ? null
      : calculateReviewCountScore(bean.rating.count, options.beans ?? [bean]);

  const score =
    ratingScore === null || reviewCountScore === null
      ? tasteMatchScore * 0.55 +
        priceFitScore * 0.25 +
        bean.data_completeness_score * 0.2
      : tasteMatchScore * 0.45 +
        priceFitScore * 0.2 +
        bean.data_completeness_score * 0.15 +
        ratingScore * 0.1 +
        reviewCountScore * 0.1;

  return Math.round(score * 100) / 100;
}

export function sortBeans(
  beans: Bean[],
  sortKey: SortKey = 'recommended',
  options: {
    query?: string;
    filters?: SearchFilters;
    context?: BeanSearchContext;
  } = {},
) {
  return [...beans].sort((a, b) => {
    const primary = compareBySortKey(a, b, sortKey, beans, options);

    if (primary !== 0) {
      return primary;
    }

    return compareTieBreakers(a, b);
  });
}

export function paginateItems<T>(items: T[], pagination: PaginationInput = {}) {
  const page = Math.max(1, Math.floor(pagination.page ?? 1));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Math.floor(pagination.limit ?? DEFAULT_LIMIT)),
  );
  const totalCount = items.length;
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;

  return {
    items: items.slice(offset, offset + limit),
    pagination: {
      page,
      limit,
      total_count: totalCount,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    },
  };
}

export function mapBeanToCard(
  bean: Bean,
  context: BeanSearchContext,
): BeanCard {
  const roastery = getRoastery(bean, context.roasteries);
  const noteByKey = new Map(
    context.tastingNotes.map((note) => [note.key, note]),
  );

  return {
    id: bean.id,
    slug: bean.slug,
    name: bean.name,
    roastery: {
      id: bean.roastery_id,
      name: roastery?.name ?? bean.roastery_id,
    },
    origin: {
      country: bean.origin.country,
      region: bean.origin.region,
    },
    roast_level: {
      key: bean.roast_level,
      label: roastLevelLabels[bean.roast_level],
    },
    price: bean.primary_package.price,
    weight_g: bean.primary_package.weight_g,
    price_per_100g: bean.primary_package.price_per_100g,
    currency: bean.primary_package.currency,
    taste_summary: {
      acidity: {
        score: bean.taste_profile.acidity,
        label: labelScore(bean.taste_profile.acidity),
      },
      body: {
        score: bean.taste_profile.body,
        label: labelScore(bean.taste_profile.body),
      },
    },
    tasting_notes: bean.tasting_notes.slice(0, 3).map((noteKey) => ({
      key: noteKey,
      label: noteByKey.get(noteKey)?.label_ko ?? noteKey,
    })),
    easy_taste_tags: bean.easy_taste_tags.slice(0, 3),
    recommended_brew_methods: bean.recommended_brew_methods
      .slice(0, 2)
      .map((method) => ({
        key: method,
        label: brewMethodLabels[method],
      })),
    image_url: bean.media.image_url,
    image_alt: bean.media.image_alt,
    is_decaf: bean.flags.is_decaf,
    is_available: bean.flags.is_available,
    product_url: bean.primary_package.product_url,
  };
}

export function mergeCategoryFilters(
  categoryFilters: CategoryFilter,
  additionalFilters: SearchFilters = {},
): SearchFilters {
  return {
    ...categoryFilters,
    ...additionalFilters,
    price_max: getRestrictiveMax(
      categoryFilters.price_max,
      additionalFilters.price_max,
    ),
    brew_method: mergeUniqueValues(
      categoryFilters.brew_method,
      additionalFilters.brew_method,
    ),
    tasting_note_groups: mergeUniqueValues(
      categoryFilters.tasting_note_groups as TastingNoteGroup[] | undefined,
      additionalFilters.tasting_note_groups,
    ),
  };
}

export function calculateRankingBeans(
  beans: Bean[],
  ranking: Ranking,
  context: BeanSearchContext,
) {
  const filteredBeans = applyBeanFilters(beans, ranking.filters, context);
  const sortedBeans = sortByRankingSort(filteredBeans, ranking, context);

  return sortedBeans.slice(0, ranking.limit);
}

export function calculateSimilarBeans(
  beans: Bean[],
  targetBeanId: string,
  options: {
    limit?: number;
  } = {},
): SimilarBean[] {
  const targetBean = beans.find((bean) => bean.id === targetBeanId);

  if (!targetBean) {
    return [];
  }

  return beans
    .filter((bean) => bean.id !== targetBean.id && bean.flags.is_available)
    .map((bean) => ({
      bean,
      similarity_score: calculateSimilarityScore(targetBean, bean),
    }))
    .sort((a, b) => {
      if (b.similarity_score !== a.similarity_score) {
        return b.similarity_score - a.similarity_score;
      }

      return compareTieBreakers(a.bean, b.bean);
    })
    .slice(0, options.limit ?? 6);
}

export function searchBeans(
  beans: Bean[],
  params: {
    query?: string;
    filters?: SearchFilters;
    sort?: SortKey;
    page?: number;
    limit?: number;
  },
  context: BeanSearchContext,
): SearchResult {
  const query = normalizeSearchQuery(params.query ?? '');
  const easyFilters = mapEasySearchQueryToFilters(query);
  const hasEasyFilters = Object.values(easyFilters).some(
    (value) => value !== undefined,
  );
  const filters = mergeSearchFilters(easyFilters, params.filters ?? {});
  const filteredBeans = applyBeanFilters(beans, filters, context);
  const textScoredBeans = filteredBeans
    .map((bean) => ({
      bean,
      score: calculateTextSearchScore(bean, query, context),
    }))
    .filter(
      (scoredBean) =>
        query.length === 0 || hasEasyFilters || scoredBean.score > 0,
    );
  const sortedBeans = sortScoredBeans(
    textScoredBeans,
    params.sort ?? 'recommended',
    {
      beans: filteredBeans,
      query,
      filters,
      context,
    },
  );
  const paginated = paginateItems(sortedBeans, {
    page: params.page,
    limit: params.limit,
  });

  return {
    items: paginated.items.map((bean) => mapBeanToCard(bean, context)),
    pagination: paginated.pagination,
    total_count: paginated.pagination.total_count,
  };
}

function containsAny(value: string, candidates: string[]) {
  return candidates.some((candidate) =>
    value.includes(normalizeSearchQuery(candidate)),
  );
}

function parsePriceMax(query: string) {
  const normalizedQuery = normalizeSearchQuery(query);
  const wonMatch = normalizedQuery.match(/(\d+)\s*원\s*이하/);
  if (wonMatch?.[1]) {
    return Number(wonMatch[1]);
  }

  const manwonMatch = normalizedQuery.match(/(\d+)\s*만원\s*이하/);
  if (manwonMatch?.[1]) {
    return Number(manwonMatch[1]) * 10000;
  }

  return null;
}

function getRoastery(bean: Bean, roasteries: Roastery[]) {
  return roasteries.find((roastery) => roastery.id === bean.roastery_id);
}

function getTastingNoteSearchFields(bean: Bean, tastingNotes: TastingNote[]) {
  const noteByKey = new Map(tastingNotes.map((note) => [note.key, note]));

  return bean.tasting_notes.flatMap((noteKey) => {
    const note = noteByKey.get(noteKey);
    return note
      ? [note.key, note.label_ko, note.label_en, ...note.aliases]
      : [noteKey];
  });
}

function toArray<T>(value: T | T[] | undefined) {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function matchesAny<T extends string>(
  value: T,
  filterValue: T | T[] | undefined,
) {
  const values = toArray(filterValue);
  return values.length === 0 || values.includes(value);
}

function matchesPriceRange(
  bean: Bean,
  filterValue: PriceRange | PriceRange[] | undefined,
) {
  const values = toArray(filterValue);

  if (values.length === 0) {
    return true;
  }

  return values.some((priceRange) => {
    const price = bean.primary_package.price;

    if (priceRange === 'under_10000') return price <= 10000;
    if (priceRange === '10000_20000') return price > 10000 && price <= 20000;
    if (priceRange === '20000_30000') return price > 20000 && price <= 30000;
    return price > 30000;
  });
}

function matchesAcidity(score: Score, filterValue: SearchFilters['acidity']) {
  const values = toArray(filterValue);

  if (values.length === 0) {
    return true;
  }

  return values.some((value) => {
    if (value === 'low') return score <= 2;
    if (value === 'medium') return score === 3;
    return score >= 4;
  });
}

function matchesBody(score: Score, filterValue: SearchFilters['body']) {
  const values = toArray(filterValue);

  if (values.length === 0) {
    return true;
  }

  return values.some((value) => {
    if (value === 'light') return score <= 2;
    if (value === 'medium') return score === 3;
    return score >= 4;
  });
}

function matchesOriginCountry(
  bean: Bean,
  filterValue: string | string[] | undefined,
) {
  const values = toArray(filterValue).map(normalizeSearchText);

  if (values.length === 0) {
    return true;
  }

  const country = normalizeSearchText(bean.origin.country);
  const countryCode = bean.origin.country_code
    ? normalizeSearchText(bean.origin.country_code)
    : null;

  return values.some((value) => value === country || value === countryCode);
}

function matchesTastingNotes(
  bean: Bean,
  filterValue: string | string[] | undefined,
) {
  const values = toArray(filterValue);
  return (
    values.length === 0 ||
    values.some((noteKey) => bean.tasting_notes.includes(noteKey))
  );
}

function matchesTastingNoteGroups(
  bean: Bean,
  filterValue: TastingNoteGroup | TastingNoteGroup[] | undefined,
  tastingNotes: TastingNote[],
) {
  const values = toArray(filterValue);

  if (values.length === 0) {
    return true;
  }

  const noteByKey = new Map(tastingNotes.map((note) => [note.key, note]));

  return bean.tasting_notes.some((noteKey) => {
    const group = noteByKey.get(noteKey)?.group;
    return group ? values.includes(group) : false;
  });
}

function matchesBrewMethod(
  bean: Bean,
  filterValue: BrewMethod | BrewMethod[] | undefined,
) {
  const values = toArray(filterValue);
  return (
    values.length === 0 ||
    values.some((method) => bean.recommended_brew_methods.includes(method))
  );
}

function getPricePer100gPercentileMax(beans: Bean[], filters: SearchFilters) {
  if (filters.price_per_100g_percentile !== 'bottom_30') {
    return null;
  }

  const sortedPrices = [...beans]
    .map((bean) => bean.primary_package.price_per_100g)
    .sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sortedPrices.length * 0.3) - 1);

  return sortedPrices[index] ?? null;
}

function calculateTasteMatchScore(
  bean: Bean,
  options: {
    query?: string;
    filters?: SearchFilters;
    textScore?: number;
    context?: BeanSearchContext;
  },
) {
  if (options.textScore !== undefined) {
    return Math.min(100, options.textScore);
  }

  if (options.query && options.context) {
    return Math.min(
      100,
      calculateTextSearchScore(bean, options.query, options.context),
    );
  }

  const filters = options.filters;
  if (!filters) {
    return bean.flags.is_featured ? 80 : 70;
  }

  let matched = 0;
  let total = 0;

  if (filters.acidity !== undefined) {
    total += 1;
    if (matchesAcidity(bean.taste_profile.acidity, filters.acidity))
      matched += 1;
  }

  if (filters.body !== undefined) {
    total += 1;
    if (matchesBody(bean.taste_profile.body, filters.body)) matched += 1;
  }

  if (filters.brew_method !== undefined) {
    total += 1;
    if (matchesBrewMethod(bean, filters.brew_method)) matched += 1;
  }

  if (filters.tasting_notes !== undefined) {
    total += 1;
    if (matchesTastingNotes(bean, filters.tasting_notes)) matched += 1;
  }

  if (total === 0) {
    return bean.flags.is_featured ? 80 : 70;
  }

  return Math.round((matched / total) * 100);
}

function calculatePriceFitScore(bean: Bean, beans: Bean[]) {
  const prices = beans.map((item) => item.primary_package.price_per_100g);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) {
    return 100;
  }

  return Math.round(
    ((max - bean.primary_package.price_per_100g) / (max - min)) * 100,
  );
}

function calculateReviewCountScore(reviewCount: number, beans: Bean[]) {
  const maxReviewCount = Math.max(
    1,
    ...beans.map((bean) => bean.rating.count ?? 0),
  );

  return Math.min(100, Math.round((reviewCount / maxReviewCount) * 100));
}

function compareBySortKey(
  a: Bean,
  b: Bean,
  sortKey: SortKey,
  beans: Bean[],
  options: {
    query?: string;
    filters?: SearchFilters;
    context?: BeanSearchContext;
  },
) {
  if (sortKey === 'recommended') {
    return (
      calculateRecommendationScore(b, { ...options, beans }) -
      calculateRecommendationScore(a, { ...options, beans })
    );
  }

  if (sortKey === 'price_asc') {
    return a.primary_package.price - b.primary_package.price;
  }

  if (sortKey === 'price_per_100g_asc') {
    return a.primary_package.price_per_100g - b.primary_package.price_per_100g;
  }

  if (sortKey === 'rating_desc') {
    return compareNullableDesc(a.rating.average, b.rating.average);
  }

  if (sortKey === 'review_count_desc') {
    return compareNullableDesc(a.rating.count, b.rating.count);
  }

  if (sortKey === 'acidity_desc') {
    return b.taste_profile.acidity - a.taste_profile.acidity;
  }

  if (sortKey === 'body_desc') {
    return b.taste_profile.body - a.taste_profile.body;
  }

  return Date.parse(b.created_at) - Date.parse(a.created_at);
}

function compareNullableDesc(
  a: number | null | undefined,
  b: number | null | undefined,
) {
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  return b - a;
}

function compareTieBreakers(a: Bean, b: Bean) {
  if (b.data_completeness_score !== a.data_completeness_score) {
    return b.data_completeness_score - a.data_completeness_score;
  }

  return a.name.localeCompare(b.name, 'ko');
}

function sortScoredBeans(
  scoredBeans: ScoredBean[],
  sortKey: SortKey,
  options: {
    beans: Bean[];
    query?: string;
    filters?: SearchFilters;
    context?: BeanSearchContext;
  },
) {
  if (sortKey !== 'recommended') {
    return sortBeans(
      scoredBeans.map((scoredBean) => scoredBean.bean),
      sortKey,
      options,
    );
  }

  return [...scoredBeans]
    .sort((a, b) => {
      const scoreA = calculateRecommendationScore(a.bean, {
        ...options,
        textScore: a.score,
      });
      const scoreB = calculateRecommendationScore(b.bean, {
        ...options,
        textScore: b.score,
      });

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      return compareTieBreakers(a.bean, b.bean);
    })
    .map((scoredBean) => scoredBean.bean);
}

function sortByRankingSort(
  beans: Bean[],
  ranking: Ranking,
  context: BeanSearchContext,
) {
  return [...beans].sort((a, b) => {
    const direction = ranking.sort.direction === 'asc' ? 1 : -1;
    const primary =
      getRankingSortValue(a, ranking, beans, context) -
      getRankingSortValue(b, ranking, beans, context);

    if (primary !== 0) {
      return primary * direction;
    }

    const recommendationDiff =
      calculateRecommendationScore(b, { beans, context }) -
      calculateRecommendationScore(a, { beans, context });

    if (recommendationDiff !== 0) {
      return recommendationDiff;
    }

    return compareTieBreakers(a, b);
  });
}

function getRankingSortValue(
  bean: Bean,
  ranking: Ranking,
  beans: Bean[],
  context: BeanSearchContext,
) {
  if (ranking.sort.field === 'price_per_100g') {
    return bean.primary_package.price_per_100g;
  }

  if (ranking.sort.field === 'recommendation_score') {
    return calculateRecommendationScore(bean, { beans, context });
  }

  if (ranking.sort.field === 'acidity') {
    return bean.taste_profile.acidity;
  }

  if (ranking.sort.field === 'body') {
    return bean.taste_profile.body;
  }

  return bean.primary_package.price;
}

function labelScore(score: Score) {
  if (score <= 2) return '낮음';
  if (score === 3) return '보통';
  return '높음';
}

function getRestrictiveMax(
  defaultMax: number | undefined,
  additionalMax: number | undefined,
) {
  if (defaultMax === undefined) return additionalMax;
  if (additionalMax === undefined) return defaultMax;
  return Math.min(defaultMax, additionalMax);
}

function mergeUniqueValues<T extends string>(
  defaultValue: T | T[] | undefined,
  additionalValue: T | T[] | undefined,
) {
  const merged = [...toArray(defaultValue), ...toArray(additionalValue)];

  if (merged.length === 0) {
    return undefined;
  }

  return [...new Set(merged)];
}

function mergeSearchFilters(
  defaultFilters: SearchFilters,
  additionalFilters: SearchFilters,
) {
  return {
    ...defaultFilters,
    ...additionalFilters,
    brew_method: mergeUniqueValues(
      defaultFilters.brew_method,
      additionalFilters.brew_method,
    ),
    tasting_notes: mergeUniqueValues(
      defaultFilters.tasting_notes,
      additionalFilters.tasting_notes,
    ),
    tasting_note_groups: mergeUniqueValues(
      defaultFilters.tasting_note_groups,
      additionalFilters.tasting_note_groups,
    ),
    roast_level: mergeUniqueValues(
      defaultFilters.roast_level,
      additionalFilters.roast_level,
    ),
    origin_country: mergeUniqueValues(
      defaultFilters.origin_country,
      additionalFilters.origin_country,
    ),
    price_max: getRestrictiveMax(
      defaultFilters.price_max,
      additionalFilters.price_max,
    ),
  };
}

function calculateSimilarityScore(targetBean: Bean, candidateBean: Bean) {
  const tasteProfileScore = calculateTasteProfileDistanceScore(
    targetBean,
    candidateBean,
  );
  const tastingNoteScore = calculateTastingNoteOverlapScore(
    targetBean,
    candidateBean,
  );
  const roastLevelScore =
    targetBean.roast_level === candidateBean.roast_level ? 100 : 0;
  const originScore =
    normalizeSearchText(targetBean.origin.country) ===
    normalizeSearchText(candidateBean.origin.country)
      ? 100
      : 0;

  return Math.round(
    tasteProfileScore * 0.4 +
      tastingNoteScore * 0.3 +
      roastLevelScore * 0.2 +
      originScore * 0.1,
  );
}

function calculateTasteProfileDistanceScore(
  targetBean: Bean,
  candidateBean: Bean,
) {
  const targetScores = [
    targetBean.taste_profile.acidity,
    targetBean.taste_profile.sweetness,
    targetBean.taste_profile.bitterness,
    targetBean.taste_profile.body,
    targetBean.taste_profile.aroma,
    targetBean.taste_profile.balance,
  ];
  const candidateScores = [
    candidateBean.taste_profile.acidity,
    candidateBean.taste_profile.sweetness,
    candidateBean.taste_profile.bitterness,
    candidateBean.taste_profile.body,
    candidateBean.taste_profile.aroma,
    candidateBean.taste_profile.balance,
  ];
  const scorePairs = targetScores.flatMap((targetScore, index) => {
    const candidateScore = candidateScores[index];
    return targetScore !== null && candidateScore !== null
      ? [{ targetScore, candidateScore }]
      : [];
  });
  const totalDistance = scorePairs.reduce(
    (sum, pair) => sum + Math.abs(pair.targetScore - pair.candidateScore),
    0,
  );
  const maxDistance = scorePairs.length * 4;

  if (maxDistance === 0) {
    return 0;
  }

  return Math.max(0, Math.round((1 - totalDistance / maxDistance) * 100));
}

function calculateTastingNoteOverlapScore(
  targetBean: Bean,
  candidateBean: Bean,
) {
  const targetNotes = new Set(targetBean.tasting_notes);
  const candidateNotes = new Set(candidateBean.tasting_notes);
  const union = new Set([...targetNotes, ...candidateNotes]);
  const intersection = [...targetNotes].filter((noteKey) =>
    candidateNotes.has(noteKey),
  );

  if (union.size === 0) {
    return 0;
  }

  return Math.round((intersection.length / union.size) * 100);
}
