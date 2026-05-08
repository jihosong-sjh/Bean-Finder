import type { FilterOptionsResponse } from '../../api/bean-finder.api';
import { filterParamLabels, sortOptions, splitParamValue } from './filter-ui';

type AppliedFilterChipsProps = {
  searchParams: URLSearchParams;
  filterOptions: FilterOptionsResponse;
  onRemove: (key: string, value?: string) => void;
  onResetFilters: () => void;
  onResetAll: () => void;
};

export function AppliedFilterChips({
  searchParams,
  filterOptions,
  onRemove,
  onResetFilters,
  onResetAll,
}: AppliedFilterChipsProps) {
  const chips = buildChips(searchParams, filterOptions);

  if (
    chips.length === 0 &&
    !searchParams.get('q') &&
    !searchParams.get('sort')
  ) {
    return null;
  }

  return (
    <div className="applied-filters" aria-label="적용된 필터">
      {searchParams.get('q') && (
        <button type="button" onClick={() => onRemove('q')}>
          검색어: {searchParams.get('q')} ×
        </button>
      )}
      {chips.map((chip) => (
        <button
          key={`${chip.key}:${chip.value ?? chip.label}`}
          type="button"
          onClick={() => onRemove(chip.key, chip.value)}
        >
          {chip.label} ×
        </button>
      ))}
      {searchParams.get('sort') &&
        searchParams.get('sort') !== 'recommended' && (
          <button type="button" onClick={() => onRemove('sort')}>
            정렬: {getSortLabel(searchParams.get('sort') ?? '')} ×
          </button>
        )}
      <button type="button" className="text-button" onClick={onResetFilters}>
        필터 초기화
      </button>
      <button type="button" className="text-button" onClick={onResetAll}>
        전체 초기화
      </button>
    </div>
  );
}

function buildChips(
  searchParams: URLSearchParams,
  filterOptions: FilterOptionsResponse,
) {
  const labelMaps = createLabelMaps(filterOptions);
  const chips: Array<{ key: string; value?: string; label: string }> = [];

  for (const [key, groupLabel] of Object.entries(filterParamLabels)) {
    const value = searchParams.get(key);

    if (!value) {
      continue;
    }

    if (
      key === 'price_min' ||
      key === 'price_max' ||
      key === 'price_per_100g_min' ||
      key === 'price_per_100g_max'
    ) {
      chips.push({ key, label: `${groupLabel}: ${value}` });
      continue;
    }

    if (key === 'is_decaf') {
      chips.push({ key, label: '디카페인' });
      continue;
    }

    for (const item of splitParamValue(value)) {
      chips.push({
        key,
        value: item,
        label: `${groupLabel}: ${labelMaps.get(key)?.get(item) ?? item}`,
      });
    }
  }

  return chips;
}

function createLabelMaps(filterOptions: FilterOptionsResponse) {
  return new Map<string, Map<string, string>>([
    ['price_range', mapOptions(filterOptions.price_ranges)],
    ['acidity', mapOptions(filterOptions.acidity)],
    ['body', mapOptions(filterOptions.body)],
    ['roast_level', mapOptions(filterOptions.roast_levels)],
    ['origin_country', mapOptions(filterOptions.origins)],
    ['tasting_notes', mapOptions(filterOptions.tasting_notes)],
    ['brew_method', mapOptions(filterOptions.brew_methods)],
    [
      'availability',
      new Map([
        ['available_only', '판매 중만'],
        ['include_sold_out', '품절 포함'],
      ]),
    ],
  ]);
}

function mapOptions(options: Array<{ key: string; label: string }>) {
  return new Map(options.map((option) => [option.key, option.label]));
}

function getSortLabel(value: string) {
  return sortOptions.find((option) => option.key === value)?.label ?? value;
}
