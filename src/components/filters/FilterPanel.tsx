import { FormEvent, useEffect, useState } from 'react';
import type { FilterOptionsResponse } from '../../api/bean-finder.api';
import { splitParamValue } from './filter-ui';

type FilterPanelProps = {
  searchParams: URLSearchParams;
  filterOptions: FilterOptionsResponse;
  onToggleValue: (key: string, value: string) => void;
  onSetValue: (key: string, value: string | null) => void;
  onSetMany: (values: Record<string, string | null>) => void;
};

export function FilterPanel({
  searchParams,
  filterOptions,
  onToggleValue,
  onSetValue,
  onSetMany,
}: FilterPanelProps) {
  const [priceFields, setPriceFields] = useState({
    price_min: searchParams.get('price_min') ?? '',
    price_max: searchParams.get('price_max') ?? '',
    price_per_100g_min: searchParams.get('price_per_100g_min') ?? '',
    price_per_100g_max: searchParams.get('price_per_100g_max') ?? '',
  });

  useEffect(() => {
    setPriceFields({
      price_min: searchParams.get('price_min') ?? '',
      price_max: searchParams.get('price_max') ?? '',
      price_per_100g_min: searchParams.get('price_per_100g_min') ?? '',
      price_per_100g_max: searchParams.get('price_per_100g_max') ?? '',
    });
  }, [searchParams]);

  function handlePriceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSetMany(
      Object.fromEntries(
        Object.entries(priceFields).map(([key, value]) => [
          key,
          value.trim() || null,
        ]),
      ),
    );
  }

  return (
    <aside className="filter-panel" aria-label="검색 필터">
      <h2>필터</h2>
      <CheckboxGroup
        title="가격대"
        paramKey="price_range"
        selected={splitParamValue(searchParams.get('price_range'))}
        options={filterOptions.price_ranges}
        onToggle={onToggleValue}
      />
      <form className="filter-panel__range" onSubmit={handlePriceSubmit}>
        <fieldset>
          <legend>가격 직접 입력</legend>
          <label>
            <span>최소 가격</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={priceFields.price_min}
              onChange={(event) =>
                setPriceFields((current) => ({
                  ...current,
                  price_min: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>최대 가격</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={priceFields.price_max}
              onChange={(event) =>
                setPriceFields((current) => ({
                  ...current,
                  price_max: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>100g당 최소</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={priceFields.price_per_100g_min}
              onChange={(event) =>
                setPriceFields((current) => ({
                  ...current,
                  price_per_100g_min: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>100g당 최대</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={priceFields.price_per_100g_max}
              onChange={(event) =>
                setPriceFields((current) => ({
                  ...current,
                  price_per_100g_max: event.target.value,
                }))
              }
            />
          </label>
          <button type="submit">가격 적용</button>
        </fieldset>
      </form>
      <CheckboxGroup
        title="산미"
        paramKey="acidity"
        selected={splitParamValue(searchParams.get('acidity'))}
        options={filterOptions.acidity}
        onToggle={onToggleValue}
      />
      <CheckboxGroup
        title="바디감"
        paramKey="body"
        selected={splitParamValue(searchParams.get('body'))}
        options={filterOptions.body}
        onToggle={onToggleValue}
      />
      <CheckboxGroup
        title="로스팅"
        paramKey="roast_level"
        selected={splitParamValue(searchParams.get('roast_level'))}
        options={filterOptions.roast_levels}
        onToggle={onToggleValue}
      />
      <CheckboxGroup
        title="원산지"
        paramKey="origin_country"
        selected={splitParamValue(searchParams.get('origin_country'))}
        options={filterOptions.origins.slice(0, 8)}
        onToggle={onToggleValue}
      />
      <CheckboxGroup
        title="컵노트"
        paramKey="tasting_notes"
        selected={splitParamValue(searchParams.get('tasting_notes'))}
        options={filterOptions.tasting_notes.slice(0, 12)}
        onToggle={onToggleValue}
      />
      <CheckboxGroup
        title="추출 방식"
        paramKey="brew_method"
        selected={splitParamValue(searchParams.get('brew_method'))}
        options={filterOptions.brew_methods}
        onToggle={onToggleValue}
      />
      <fieldset className="filter-panel__group">
        <legend>디카페인</legend>
        <label>
          <input
            type="checkbox"
            checked={searchParams.get('is_decaf') === 'true'}
            onChange={(event) =>
              onSetValue('is_decaf', event.target.checked ? 'true' : null)
            }
          />
          <span>디카페인만 보기</span>
        </label>
      </fieldset>
      <label className="filter-panel__select">
        <span>판매 상태</span>
        <select
          value={searchParams.get('availability') ?? 'available_only'}
          onChange={(event) => onSetValue('availability', event.target.value)}
        >
          <option value="available_only">판매 중만</option>
          <option value="include_sold_out">품절 포함</option>
        </select>
      </label>
    </aside>
  );
}

function CheckboxGroup({
  title,
  paramKey,
  selected,
  options,
  onToggle,
}: {
  title: string;
  paramKey: string;
  selected: string[];
  options: Array<{ key: string; label: string }>;
  onToggle: (key: string, value: string) => void;
}) {
  return (
    <fieldset className="filter-panel__group">
      <legend>{title}</legend>
      {options.map((option) => (
        <label key={option.key}>
          <input
            type="checkbox"
            checked={selected.includes(option.key)}
            onChange={() => onToggle(paramKey, option.key)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
