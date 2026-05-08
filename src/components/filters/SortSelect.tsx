import type { SortKey } from '../../features/beans/bean.search';
import { sortOptions } from './filter-ui';

type SortSelectProps = {
  value: SortKey;
  onChange: (value: SortKey) => void;
};

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <label className="sort-select">
      <span>정렬</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortKey)}
      >
        {sortOptions.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
