import { FormEvent, useEffect, useId, useState } from 'react';

type SearchInputProps = {
  defaultValue?: string;
  label?: string;
  placeholder?: string;
  size?: 'compact' | 'large';
  onSearch: (query: string) => void;
};

export function SearchInput({
  defaultValue = '',
  label = '원두 검색',
  placeholder = '신맛 적은 원두 검색',
  size = 'compact',
  onSearch,
}: SearchInputProps) {
  const inputId = useId();
  const [query, setQuery] = useState(defaultValue);

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(query.trim());
  }

  return (
    <form
      className={`search-input search-input--${size}`}
      role="search"
      onSubmit={handleSubmit}
    >
      <label
        className={size === 'compact' ? 'sr-only' : undefined}
        htmlFor={inputId}
      >
        {label}
      </label>
      <div>
        <input
          id={inputId}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
        />
        <button type="submit">검색</button>
      </div>
    </form>
  );
}
