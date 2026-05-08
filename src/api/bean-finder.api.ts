import { loadBeanData } from '../features/beans/bean.repository';
import {
  calculatePricePer100g,
  createEasyTasteTags,
} from '../features/beans/bean.derived';
import {
  calculateRankingBeans,
  calculateSimilarBeans,
  mapBeanToCard,
  mergeCategoryFilters,
  searchBeans,
} from '../features/beans/bean.search';
import type {
  AvailabilityFilter,
  BeanCard,
  PriceRange,
  SearchFilters,
  SortKey,
} from '../features/beans/bean.search';
import type {
  Bean,
  BrewMethod,
  Process,
  RoastLevel,
  Score,
  TastingNoteGroup,
} from '../features/beans/bean.types';
import { beanInputSchema } from '../features/beans/bean.validation';
import { apiError, apiSuccess } from './api.response';
import type { ApiFailure, ApiResult } from './api.response';
import { eventNames } from './event.types';
import type { ZodIssue } from 'zod';

type QueryValue = string | number | boolean | string[] | undefined;
type QueryInput = URLSearchParams | Record<string, QueryValue>;

export type HomeResponse = {
  suggested_queries: string[];
  featured_categories: Array<{
    key: string;
    title: string;
    description: string;
  }>;
  featured_rankings: Array<{
    key: string;
    title: string;
    description: string;
  }>;
};

type CategoryListItem = {
  key: string;
  title: string;
  description: string;
  default_filters: SearchFilters;
  default_sort: string;
  display_order: number;
};

type RankingListItem = {
  key: string;
  title: string;
  description: string;
  display_order: number;
};

type RankingBean = {
  rank: number;
  bean: BeanCard;
};

export type FilterOption = {
  key: string;
  label: string;
  count: number | null;
};

export type TastingNoteFilterOption = FilterOption & {
  group: TastingNoteGroup;
};

export type FilterOptionsResponse = {
  price_ranges: FilterOption[];
  acidity: FilterOption[];
  body: FilterOption[];
  roast_levels: FilterOption[];
  origins: FilterOption[];
  tasting_notes: TastingNoteFilterOption[];
  brew_methods: FilterOption[];
};

type EventRequestBody = {
  event_name?: unknown;
  occurred_at?: unknown;
  page_path?: unknown;
  properties?: unknown;
};

type ValidationMessage = {
  field: string;
  message: string;
};

type BeanValidationResult = {
  id: string;
  valid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  computed: {
    price_per_100g: number | null;
    easy_taste_tags: string[];
  };
};

type ValidateBeansResponse = {
  valid: boolean;
  summary: {
    total: number;
    valid_count: number;
    invalid_count: number;
    warning_count: number;
  };
  results: BeanValidationResult[];
};

export type BeanDetail = {
  id: string;
  slug: string;
  name: string;
  roastery: {
    id: string;
    slug: string;
    name: string;
    website_url: string | null;
  };
  origin: Bean['origin'];
  variety: string | null;
  process: {
    key: Process;
    label: string;
  };
  roast_level: {
    key: RoastLevel;
    label: string;
  };
  tasting_notes: Array<{
    key: string;
    label: string;
    group: TastingNoteGroup;
  }>;
  taste_profile: {
    acidity: ScoreValue;
    sweetness: ScoreValue;
    bitterness: ScoreValue;
    body: ScoreValue;
    aroma: NullableScoreValue;
    balance: NullableScoreValue;
  };
  easy_taste_tags: string[];
  recommended_brew_methods: LabelValue<BrewMethod>[];
  package: {
    price: number;
    weight_g: number;
    price_per_100g: number;
    currency: 'KRW';
    package_label: string | null;
    product_url: string;
    affiliate_url: string | null;
  };
  media: Bean['media'];
  rating: Bean['rating'];
  flags: Bean['flags'];
  source: {
    type: Bean['source']['type'];
    name: string;
    url: string | null;
    last_checked_at: string;
  };
};

export type BatchBeanCard = Omit<
  BeanCard,
  'taste_summary' | 'easy_taste_tags'
> & {
  taste_profile: {
    acidity: ScoreValue;
    sweetness: ScoreValue;
    bitterness: ScoreValue;
    body: ScoreValue;
  };
};

type ScoreValue = {
  score: Score;
  label: string;
};

type NullableScoreValue = {
  score: Score | null;
  label: string | null;
};

type LabelValue<TKey extends string> = {
  key: TKey;
  label: string;
};

const priceRanges = [
  'under_10000',
  '10000_20000',
  '20000_30000',
  'over_30000',
] as const satisfies readonly PriceRange[];
const acidityValues = ['low', 'medium', 'high'] as const;
const bodyValues = ['light', 'medium', 'heavy'] as const;
const roastLevels = ['light', 'medium', 'medium_dark', 'dark'] as const;
const brewMethods = [
  'hand_drip',
  'espresso',
  'latte',
  'cold_brew',
  'moka_pot',
  'french_press',
] as const;
const tastingNoteGroups = [
  'fruit',
  'berry',
  'floral',
  'nut',
  'chocolate',
  'sweet',
  'spice',
  'herbal',
  'roasted',
  'other',
] as const;
const availabilityValues = [
  'available_only',
  'include_sold_out',
] as const satisfies readonly AvailabilityFilter[];
const sortKeys = [
  'recommended',
  'price_asc',
  'price_per_100g_asc',
  'rating_desc',
  'review_count_desc',
  'acidity_desc',
  'body_desc',
  'newest',
] as const satisfies readonly SortKey[];

const processLabels: Record<Process, string> = {
  washed: '워시드',
  natural: '내추럴',
  honey: '허니',
  anaerobic: '무산소',
  semi_washed: '세미 워시드',
  blend: '블렌드',
  unknown: '알 수 없음',
};

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

const priceRangeLabels: Record<PriceRange, string> = {
  under_10000: '1만원 이하',
  '10000_20000': '1만원 초과 2만원 이하',
  '20000_30000': '2만원 초과 3만원 이하',
  over_30000: '3만원 초과',
};

const acidityLabels: Record<(typeof acidityValues)[number], string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
};

const bodyLabels: Record<(typeof bodyValues)[number], string> = {
  light: '가벼움',
  medium: '보통',
  heavy: '묵직함',
};

export function getHomeApi(): ApiResult<HomeResponse> {
  const data = loadBeanData();

  return apiSuccess({
    suggested_queries: [
      '신맛 적은 원두',
      '라떼에 좋은 원두',
      '2만원 이하 원두',
      '베리향 에티오피아',
    ],
    featured_categories: data.categories
      .filter((category) => category.is_active)
      .sort((a, b) => a.display_order - b.display_order)
      .slice(0, 6)
      .map((category) => ({
        key: category.key,
        title: category.title,
        description: category.description,
      })),
    featured_rankings: data.rankings
      .filter((ranking) => ranking.is_active)
      .sort((a, b) => a.display_order - b.display_order)
      .slice(0, 4)
      .map((ranking) => ({
        key: ranking.key,
        title: ranking.title,
        description: ranking.description,
      })),
  });
}

export function getBeansSearchApi(query: QueryInput = {}) {
  const parsedQuery = parseSearchQuery(query);
  if (!parsedQuery.ok) {
    return parsedQuery.error;
  }

  const data = loadBeanData();
  const context = {
    roasteries: data.roasteries,
    tastingNotes: data.tastingNotes,
  };
  const result = searchBeans(
    data.beans,
    {
      query: parsedQuery.value.q,
      filters: parsedQuery.value.filters,
      sort: parsedQuery.value.sort,
      page: parsedQuery.value.page,
      limit: parsedQuery.value.limit,
    },
    context,
  );

  return apiSuccess(result.items, {
    query: {
      q: parsedQuery.value.q,
      filters: parsedQuery.value.filters,
      sort: parsedQuery.value.sort,
    },
    result_count: result.total_count,
    pagination: result.pagination,
  });
}

export function getBeanDetailApi(beanId: string): ApiResult<BeanDetail> {
  const data = loadBeanData();
  const bean = data.beans.find(
    (item) => item.id === beanId || item.slug === beanId,
  );

  if (!bean) {
    return apiError(404, 'NOT_FOUND', '원두를 찾을 수 없습니다.', [
      { field: 'beanId', reason: '존재하지 않는 원두 ID 또는 slug입니다.' },
    ]);
  }

  return apiSuccess(mapBeanToDetail(bean, data));
}

export function getBeansBatchApi(query: QueryInput = {}) {
  const ids = parseListParam(query, 'ids');

  if (ids.length === 0) {
    return apiError(400, 'INVALID_QUERY', 'ids가 비어 있습니다.', [
      { field: 'ids', reason: '최소 1개의 bean id가 필요합니다.' },
    ]);
  }

  if (ids.length > 4) {
    return apiError(400, 'INVALID_QUERY', 'ids는 최대 4개까지 허용됩니다.', [
      { field: 'ids', reason: '비교함은 최대 4개 원두만 조회할 수 있습니다.' },
    ]);
  }

  const data = loadBeanData();
  const beanById = new Map(data.beans.map((bean) => [bean.id, bean]));
  const items = ids
    .map((id) => beanById.get(id))
    .filter((bean): bean is Bean => Boolean(bean))
    .map((bean) => mapBeanToBatchCard(bean, data));
  const foundIds = new Set(items.map((item) => item.id));

  return apiSuccess(items, {
    missing_ids: ids.filter((id) => !foundIds.has(id)),
  });
}

export function getBeanSimilarApi(beanId: string, query: QueryInput = {}) {
  const limitResult = parseIntegerParam(query, 'limit', {
    defaultValue: 6,
    min: 1,
    max: 12,
  });

  if (!limitResult.ok) {
    return limitResult.error;
  }

  const data = loadBeanData();
  const baseBean = data.beans.find(
    (bean) => bean.id === beanId || bean.slug === beanId,
  );

  if (!baseBean) {
    return apiError(404, 'NOT_FOUND', '기준 원두를 찾을 수 없습니다.', [
      { field: 'beanId', reason: '존재하지 않는 원두 ID 또는 slug입니다.' },
    ]);
  }

  const context = {
    roasteries: data.roasteries,
    tastingNotes: data.tastingNotes,
  };
  const similarBeans = calculateSimilarBeans(data.beans, baseBean.id, {
    limit: limitResult.value,
  }).map((item) => mapBeanToCard(item.bean, context));

  return apiSuccess(similarBeans, {
    base_bean_id: baseBean.id,
  });
}

export function getCategoriesApi(): ApiResult<CategoryListItem[]> {
  const data = loadBeanData();

  return apiSuccess(
    data.categories
      .filter((category) => category.is_active)
      .sort((a, b) => a.display_order - b.display_order)
      .map((category) => ({
        key: category.key,
        title: category.title,
        description: category.description,
        default_filters: category.default_filters as SearchFilters,
        default_sort: category.default_sort,
        display_order: category.display_order,
      })),
  );
}

export function getCategoryBeansApi(
  categoryKey: string,
  query: QueryInput = {},
) {
  const data = loadBeanData();
  const category = data.categories.find(
    (item) => item.key === categoryKey && item.is_active,
  );

  if (!category) {
    return apiError(404, 'NOT_FOUND', '카테고리를 찾을 수 없습니다.', [
      { field: 'categoryKey', reason: '존재하지 않는 카테고리 key입니다.' },
    ]);
  }

  const defaultSort = isSortKey(category.default_sort)
    ? category.default_sort
    : 'recommended';
  const parsedQuery = parseSearchQuery(query, { defaultSort });
  if (!parsedQuery.ok) {
    return parsedQuery.error;
  }

  const includeCategoryFilter = parseOptionalBooleanParam(
    query,
    'include_category_filter',
  );
  if (!includeCategoryFilter.ok) {
    return includeCategoryFilter.error;
  }

  const context = {
    roasteries: data.roasteries,
    tastingNotes: data.tastingNotes,
  };
  const filters =
    includeCategoryFilter.value === false
      ? parsedQuery.value.filters
      : mergeCategoryFilters(
          category.default_filters,
          parsedQuery.value.filters,
        );
  const result = searchBeans(
    data.beans,
    {
      query: parsedQuery.value.q,
      filters,
      sort: parsedQuery.value.sort,
      page: parsedQuery.value.page,
      limit: parsedQuery.value.limit,
    },
    context,
  );

  return apiSuccess(result.items, {
    category: {
      key: category.key,
      title: category.title,
      description: category.description,
      default_filters: category.default_filters,
    },
    result_count: result.total_count,
    pagination: result.pagination,
  });
}

export function getRankingsApi(): ApiResult<RankingListItem[]> {
  const data = loadBeanData();

  return apiSuccess(
    data.rankings
      .filter((ranking) => ranking.is_active)
      .sort((a, b) => a.display_order - b.display_order)
      .map((ranking) => ({
        key: ranking.key,
        title: ranking.title,
        description: ranking.description,
        display_order: ranking.display_order,
      })),
  );
}

export function getRankingBeansApi(
  rankingKey: string,
  query: QueryInput = {},
): ApiResult<RankingBean[]> {
  const limitResult = parseIntegerParam(query, 'limit', {
    defaultValue: 50,
    min: 1,
    max: 50,
  });
  if (!limitResult.ok) {
    return limitResult.error;
  }

  const data = loadBeanData();
  const ranking = data.rankings.find(
    (item) => item.key === rankingKey && item.is_active,
  );

  if (!ranking) {
    return apiError(404, 'NOT_FOUND', '랭킹을 찾을 수 없습니다.', [
      { field: 'rankingKey', reason: '존재하지 않는 랭킹 key입니다.' },
    ]);
  }

  const context = {
    roasteries: data.roasteries,
    tastingNotes: data.tastingNotes,
  };
  const rankedBeans = calculateRankingBeans(data.beans, ranking, context)
    .slice(0, limitResult.value)
    .map((bean, index) => ({
      rank: index + 1,
      bean: mapBeanToCard(bean, context),
    }));

  return apiSuccess(rankedBeans, {
    ranking: {
      key: ranking.key,
      title: ranking.title,
      description: ranking.description,
      criteria: formatRankingCriteria(ranking),
    },
    result_count: rankedBeans.length,
  });
}

export function getFilterOptionsApi(
  query: QueryInput = {},
): ApiResult<FilterOptionsResponse> {
  const parsedQuery = parseSearchQuery(query);
  if (!parsedQuery.ok) {
    return parsedQuery.error;
  }

  const data = loadBeanData();
  const originCountries = [
    ...new Set(data.beans.map((bean) => bean.origin.country).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  return apiSuccess({
    price_ranges: priceRanges.map((key) => ({
      key,
      label: priceRangeLabels[key],
      count: null,
    })),
    acidity: acidityValues.map((key) => ({
      key,
      label: acidityLabels[key],
      count: null,
    })),
    body: bodyValues.map((key) => ({
      key,
      label: bodyLabels[key],
      count: null,
    })),
    roast_levels: roastLevels.map((key) => ({
      key,
      label: roastLevelLabels[key],
      count: null,
    })),
    origins: originCountries.map((country) => ({
      key: country,
      label: country,
      count: null,
    })),
    tasting_notes: data.tastingNotes
      .slice()
      .sort((a, b) => a.label_ko.localeCompare(b.label_ko, 'ko'))
      .map((note) => ({
        key: note.key,
        label: note.label_ko,
        group: note.group,
        count: null,
      })),
    brew_methods: brewMethods.map((key) => ({
      key,
      label: brewMethodLabels[key],
      count: null,
    })),
  });
}

export function postEventApi(body: unknown = {}) {
  if (!isRecord(body)) {
    return apiError(400, 'INVALID_BODY', '요청 본문이 올바르지 않습니다.', [
      { field: 'body', reason: 'JSON object여야 합니다.' },
    ]);
  }

  const requiredFields: Array<keyof EventRequestBody> = [
    'event_name',
    'occurred_at',
    'page_path',
  ];
  const missingField = requiredFields.find(
    (field) => typeof body[field] !== 'string' || body[field] === '',
  );

  if (missingField) {
    return apiError(400, 'INVALID_BODY', '필수 필드가 누락되었습니다.', [
      { field: missingField, reason: '비어 있지 않은 문자열이어야 합니다.' },
    ]);
  }

  if (!eventNames.includes(body.event_name as (typeof eventNames)[number])) {
    return apiError(400, 'INVALID_BODY', '허용되지 않은 이벤트명입니다.', [
      {
        field: 'event_name',
        reason: `허용되지 않는 값입니다: ${body.event_name}`,
      },
    ]);
  }

  if (Number.isNaN(Date.parse(body.occurred_at as string))) {
    return apiError(400, 'INVALID_BODY', '발생 시각이 올바르지 않습니다.', [
      {
        field: 'occurred_at',
        reason: 'ISO-8601 datetime 문자열이어야 합니다.',
      },
    ]);
  }

  if (body.properties !== undefined && !isRecord(body.properties)) {
    return apiError(400, 'INVALID_BODY', '이벤트 속성이 올바르지 않습니다.', [
      { field: 'properties', reason: 'JSON object여야 합니다.' },
    ]);
  }

  return apiSuccess({ accepted: true });
}

export function postInternalBeansValidateApi(body: unknown = {}) {
  if (!isRecord(body) || !Array.isArray(body.beans)) {
    return apiError(400, 'INVALID_BODY', '검증할 원두 목록이 필요합니다.', [
      { field: 'beans', reason: '배열이어야 합니다.' },
    ]);
  }

  const data = loadBeanData();
  const idCounts = countStringIds(body.beans);
  const roasteryIds = new Set(data.roasteries.map((roastery) => roastery.id));
  const tastingNoteKeys = new Set(data.tastingNotes.map((note) => note.key));
  const results = body.beans.map((rawBean, index) => {
    const parsed = beanInputSchema.safeParse(rawBean);
    const fallbackId = getRawBeanId(rawBean) ?? `beans.${index}`;
    const errors: ValidationMessage[] = parsed.success
      ? []
      : parsed.error.issues.map(zodIssueToValidationMessage);
    const warnings: ValidationMessage[] = [];
    let computed: BeanValidationResult['computed'] = {
      price_per_100g: null,
      easy_taste_tags: [],
    };

    if (parsed.success) {
      const bean = parsed.data;

      if ((idCounts.get(bean.id) ?? 0) > 1) {
        errors.push({
          field: 'id',
          message: `중복 id입니다: ${bean.id}`,
        });
      }

      if (!roasteryIds.has(bean.roastery_id)) {
        errors.push({
          field: 'roastery_id',
          message: `존재하지 않는 roastery_id입니다: ${bean.roastery_id}`,
        });
      }

      for (const noteKey of bean.tasting_notes) {
        if (!tastingNoteKeys.has(noteKey)) {
          errors.push({
            field: 'tasting_notes',
            message: `존재하지 않는 tasting note입니다: ${noteKey}`,
          });
        }
      }

      computed = {
        price_per_100g: calculatePricePer100g(
          bean.primary_package.price,
          bean.primary_package.weight_g,
        ),
        easy_taste_tags: createEasyTasteTags(bean, data.tastingNotes),
      };
      warnings.push(...createBeanValidationWarnings(bean, computed));
    }

    return {
      id: parsed.success ? parsed.data.id : fallbackId,
      valid: errors.length === 0,
      errors,
      warnings,
      computed,
    };
  });
  const invalidCount = results.filter((result) => !result.valid).length;
  const warningCount = results.reduce(
    (sum, result) => sum + result.warnings.length,
    0,
  );

  return apiSuccess<ValidateBeansResponse>({
    valid: invalidCount === 0,
    summary: {
      total: results.length,
      valid_count: results.length - invalidCount,
      invalid_count: invalidCount,
      warning_count: warningCount,
    },
    results,
  });
}

function parseSearchQuery(
  query: QueryInput,
  options: {
    defaultSort?: SortKey;
  } = {},
):
  | {
      ok: true;
      value: {
        q: string;
        filters: SearchFilters;
        sort: SortKey;
        page: number;
        limit: number;
      };
    }
  | { ok: false; error: ApiFailure } {
  const pricePer100gMin = parseOptionalIntegerParam(
    query,
    'price_per_100g_min',
  );
  if (!pricePer100gMin.ok) return pricePer100gMin;

  const pricePer100gMax = parseOptionalIntegerParam(
    query,
    'price_per_100g_max',
  );
  if (!pricePer100gMax.ok) return pricePer100gMax;

  if (
    pricePer100gMin.value !== undefined &&
    pricePer100gMax.value !== undefined &&
    pricePer100gMin.value > pricePer100gMax.value
  ) {
    return {
      ok: false,
      error: apiError(
        400,
        'INVALID_QUERY',
        '요청 파라미터가 올바르지 않습니다.',
        [
          {
            field: 'price_per_100g_min',
            reason: '최소값은 최대값보다 클 수 없습니다.',
          },
        ],
      ),
    };
  }

  const priceMin = parseOptionalIntegerParam(query, 'price_min');
  if (!priceMin.ok) return priceMin;

  const priceMax = parseOptionalIntegerParam(query, 'price_max');
  if (!priceMax.ok) return priceMax;

  const page = parseIntegerParam(query, 'page', {
    defaultValue: 1,
    min: 1,
  });
  if (!page.ok) return page;

  const limit = parseIntegerParam(query, 'limit', {
    defaultValue: 20,
    min: 1,
    max: 50,
  });
  if (!limit.ok) return limit;

  const filters: SearchFilters = {};
  const priceRange = parseEnumListParam(query, 'price_range', priceRanges);
  if (!priceRange.ok) return priceRange;

  const acidity = parseEnumListParam(query, 'acidity', acidityValues);
  if (!acidity.ok) return acidity;

  const body = parseEnumListParam(query, 'body', bodyValues);
  if (!body.ok) return body;

  const roastLevel = parseEnumListParam(query, 'roast_level', roastLevels);
  if (!roastLevel.ok) return roastLevel;

  const tastingNoteGroup = parseEnumListParam(
    query,
    'tasting_note_groups',
    tastingNoteGroups,
  );
  if (!tastingNoteGroup.ok) return tastingNoteGroup;

  const brewMethod = parseEnumListParam(query, 'brew_method', brewMethods);
  if (!brewMethod.ok) return brewMethod;

  const availability = parseEnumParam(
    query,
    'availability',
    availabilityValues,
  );
  if (!availability.ok) return availability;

  const sort = parseEnumParam(
    query,
    'sort',
    sortKeys,
    options.defaultSort ?? 'recommended',
  );
  if (!sort.ok) return sort;

  const isDecaf = parseOptionalBooleanParam(query, 'is_decaf');
  if (!isDecaf.ok) return isDecaf;

  if (priceRange.value.length > 0) filters.price_range = priceRange.value;
  if (priceMin.value !== undefined) filters.price_min = priceMin.value;
  if (priceMax.value !== undefined) filters.price_max = priceMax.value;
  if (pricePer100gMin.value !== undefined) {
    filters.price_per_100g_min = pricePer100gMin.value;
  }
  if (pricePer100gMax.value !== undefined) {
    filters.price_per_100g_max = pricePer100gMax.value;
  }
  if (acidity.value.length > 0) filters.acidity = acidity.value;
  if (body.value.length > 0) filters.body = body.value;
  if (roastLevel.value.length > 0) filters.roast_level = roastLevel.value;
  if (getStringParam(query, 'origin_country')) {
    filters.origin_country = parseListParam(query, 'origin_country');
  }
  if (getStringParam(query, 'tasting_notes')) {
    filters.tasting_notes = parseListParam(query, 'tasting_notes');
  }
  if (tastingNoteGroup.value.length > 0) {
    filters.tasting_note_groups = tastingNoteGroup.value;
  }
  if (brewMethod.value.length > 0) filters.brew_method = brewMethod.value;
  if (isDecaf.value !== undefined) filters.is_decaf = isDecaf.value;
  filters.availability = availability.value ?? 'available_only';

  return {
    ok: true,
    value: {
      q: getStringParam(query, 'q') ?? '',
      filters,
      sort: sort.value ?? 'recommended',
      page: page.value,
      limit: limit.value,
    },
  };
}

function parseIntegerParam(
  query: QueryInput,
  field: string,
  options: {
    defaultValue: number;
    min?: number;
    max?: number;
  },
): { ok: true; value: number } | { ok: false; error: ApiFailure } {
  const value = getStringParam(query, field);

  if (!value) {
    return { ok: true, value: options.defaultValue };
  }

  const numberValue = Number(value);

  if (!Number.isInteger(numberValue)) {
    return invalidQuery(field, '정수여야 합니다.');
  }

  if (options.min !== undefined && numberValue < options.min) {
    return invalidQuery(field, `${options.min} 이상이어야 합니다.`);
  }

  if (options.max !== undefined && numberValue > options.max) {
    return invalidQuery(field, `${options.max} 이하여야 합니다.`);
  }

  return { ok: true, value: numberValue };
}

function parseOptionalIntegerParam(
  query: QueryInput,
  field: string,
): { ok: true; value: number | undefined } | { ok: false; error: ApiFailure } {
  const value = getStringParam(query, field);

  if (!value) {
    return { ok: true, value: undefined };
  }

  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 0) {
    return invalidQuery(field, '0 이상의 정수여야 합니다.');
  }

  return { ok: true, value: numberValue };
}

function parseOptionalBooleanParam(
  query: QueryInput,
  field: string,
): { ok: true; value: boolean | undefined } | { ok: false; error: ApiFailure } {
  const value = getStringParam(query, field);

  if (!value) {
    return { ok: true, value: undefined };
  }

  if (value === 'true') return { ok: true, value: true };
  if (value === 'false') return { ok: true, value: false };

  return invalidQuery(field, 'true 또는 false여야 합니다.');
}

function parseEnumParam<TValue extends string>(
  query: QueryInput,
  field: string,
  allowedValues: readonly TValue[],
  defaultValue?: TValue,
): { ok: true; value: TValue | undefined } | { ok: false; error: ApiFailure } {
  const value = getStringParam(query, field);

  if (!value) {
    return { ok: true, value: defaultValue };
  }

  if (allowedValues.includes(value as TValue)) {
    return { ok: true, value: value as TValue };
  }

  return invalidQuery(field, `허용되지 않는 값입니다: ${value}`);
}

function parseEnumListParam<TValue extends string>(
  query: QueryInput,
  field: string,
  allowedValues: readonly TValue[],
): { ok: true; value: TValue[] } | { ok: false; error: ApiFailure } {
  const values = parseListParam(query, field);
  const invalidValue = values.find(
    (value) => !allowedValues.includes(value as TValue),
  );

  if (invalidValue) {
    return invalidQuery(field, `허용되지 않는 값입니다: ${invalidValue}`);
  }

  return { ok: true, value: values as TValue[] };
}

function parseListParam(query: QueryInput, field: string) {
  const rawValue = getRawQueryValue(query, field);

  if (Array.isArray(rawValue)) {
    return rawValue.flatMap(splitCommaSeparated).filter(Boolean);
  }

  if (rawValue === undefined) {
    return [];
  }

  return splitCommaSeparated(String(rawValue)).filter(Boolean);
}

function splitCommaSeparated(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getStringParam(query: QueryInput, field: string) {
  const rawValue = getRawQueryValue(query, field);

  if (Array.isArray(rawValue)) {
    return rawValue[0];
  }

  if (rawValue === undefined) {
    return undefined;
  }

  return String(rawValue);
}

function getRawQueryValue(query: QueryInput, field: string) {
  if (query instanceof URLSearchParams) {
    return query.get(field) ?? undefined;
  }

  return query[field];
}

function invalidQuery(field: string, reason: string) {
  return {
    ok: false as const,
    error: apiError(
      400,
      'INVALID_QUERY',
      '요청 파라미터가 올바르지 않습니다.',
      [{ field, reason }],
    ),
  };
}

function isSortKey(value: string): value is SortKey {
  return sortKeys.includes(value as SortKey);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatRankingCriteria(
  ranking: ReturnType<typeof loadBeanData>['rankings'][number],
) {
  const fieldLabels: Record<typeof ranking.sort.field, string> = {
    price_per_100g: 'price_per_100g',
    recommendation_score: '추천 점수',
    acidity: '산미',
    body: '바디',
    price: '가격',
  };
  const directionLabel =
    ranking.sort.direction === 'asc' ? '오름차순' : '내림차순';

  return `${fieldLabels[ranking.sort.field]} ${directionLabel}`;
}

function countStringIds(beans: unknown[]) {
  const idCounts = new Map<string, number>();

  for (const bean of beans) {
    const id = getRawBeanId(bean);

    if (id) {
      idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
    }
  }

  return idCounts;
}

function getRawBeanId(bean: unknown) {
  if (!isRecord(bean) || typeof bean.id !== 'string' || bean.id.length === 0) {
    return null;
  }

  return bean.id;
}

function zodIssueToValidationMessage(issue: ZodIssue): ValidationMessage {
  return {
    field: issue.path.length > 0 ? issue.path.join('.') : 'body',
    message: issue.message,
  };
}

function createBeanValidationWarnings(
  bean: {
    primary_package: {
      price: number;
    };
    source: {
      last_checked_at: string;
    };
  },
  computed: BeanValidationResult['computed'],
) {
  const warnings: ValidationMessage[] = [];

  if (
    bean.primary_package.price < 5000 ||
    bean.primary_package.price > 100000
  ) {
    warnings.push({
      field: 'primary_package.price',
      message: 'MVP 운영 범위를 벗어난 가격입니다.',
    });
  }

  if (
    computed.price_per_100g !== null &&
    (computed.price_per_100g < 1000 || computed.price_per_100g > 50000)
  ) {
    warnings.push({
      field: 'primary_package.price_per_100g',
      message: `price와 weight_g 기준으로 ${computed.price_per_100g}이 계산됩니다.`,
    });
  }

  const checkedAt = Date.parse(bean.source.last_checked_at);
  const daysSinceChecked = (Date.now() - checkedAt) / (1000 * 60 * 60 * 24);

  if (Number.isFinite(daysSinceChecked) && daysSinceChecked > 180) {
    warnings.push({
      field: 'source.last_checked_at',
      message: '마지막 확인일이 180일을 초과했습니다.',
    });
  }

  return warnings;
}

function mapBeanToDetail(
  bean: Bean,
  data: ReturnType<typeof loadBeanData>,
): BeanDetail {
  const roastery = data.roasteries.find((item) => item.id === bean.roastery_id);

  return {
    id: bean.id,
    slug: bean.slug,
    name: bean.name,
    roastery: {
      id: bean.roastery_id,
      slug: roastery?.slug ?? bean.roastery_id,
      name: roastery?.name ?? bean.roastery_id,
      website_url: roastery?.website_url ?? null,
    },
    origin: bean.origin,
    variety: bean.variety,
    process: {
      key: bean.process,
      label: processLabels[bean.process],
    },
    roast_level: {
      key: bean.roast_level,
      label: roastLevelLabels[bean.roast_level],
    },
    tasting_notes: mapTastingNotes(bean, data),
    taste_profile: {
      acidity: mapScore(bean.taste_profile.acidity),
      sweetness: mapScore(bean.taste_profile.sweetness),
      bitterness: mapScore(bean.taste_profile.bitterness),
      body: mapScore(bean.taste_profile.body),
      aroma: mapNullableScore(bean.taste_profile.aroma),
      balance: mapNullableScore(bean.taste_profile.balance),
    },
    easy_taste_tags: bean.easy_taste_tags,
    recommended_brew_methods: bean.recommended_brew_methods.map((method) => ({
      key: method,
      label: brewMethodLabels[method],
    })),
    package: {
      price: bean.primary_package.price,
      weight_g: bean.primary_package.weight_g,
      price_per_100g: bean.primary_package.price_per_100g,
      currency: bean.primary_package.currency,
      package_label: bean.primary_package.package_label,
      product_url: bean.primary_package.product_url,
      affiliate_url: bean.primary_package.affiliate_url,
    },
    media: bean.media,
    rating: bean.rating,
    flags: bean.flags,
    source: {
      type: bean.source.type,
      name: bean.source.name,
      url: bean.source.url,
      last_checked_at: bean.source.last_checked_at,
    },
  };
}

function mapBeanToBatchCard(
  bean: Bean,
  data: ReturnType<typeof loadBeanData>,
): BatchBeanCard {
  const context = {
    roasteries: data.roasteries,
    tastingNotes: data.tastingNotes,
  };
  const card = mapBeanToCard(bean, context);
  const baseCard = { ...card } as Omit<
    BeanCard,
    'taste_summary' | 'easy_taste_tags'
  > &
    Partial<Pick<BeanCard, 'taste_summary' | 'easy_taste_tags'>>;
  delete baseCard.taste_summary;
  delete baseCard.easy_taste_tags;

  return {
    ...baseCard,
    taste_profile: {
      acidity: mapScore(bean.taste_profile.acidity),
      sweetness: mapScore(bean.taste_profile.sweetness),
      bitterness: mapScore(bean.taste_profile.bitterness),
      body: mapScore(bean.taste_profile.body),
    },
  };
}

function mapTastingNotes(bean: Bean, data: ReturnType<typeof loadBeanData>) {
  const noteByKey = new Map(data.tastingNotes.map((note) => [note.key, note]));

  return bean.tasting_notes.map((noteKey) => {
    const note = noteByKey.get(noteKey);

    return {
      key: noteKey,
      label: note?.label_ko ?? noteKey,
      group: note?.group ?? 'other',
    };
  });
}

function mapScore(score: Score): ScoreValue {
  return {
    score,
    label: labelScore(score),
  };
}

function mapNullableScore(score: Score | null): NullableScoreValue {
  return {
    score,
    label: score === null ? null : labelScore(score),
  };
}

function labelScore(score: Score) {
  if (score === 1) return '매우 낮음';
  if (score === 2) return '낮음';
  if (score === 3) return '보통';
  if (score === 4) return '높음';
  return '매우 높음';
}
