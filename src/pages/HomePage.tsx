import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set('q', query.trim());
    }

    navigate(`/search${params.size ? `?${params.toString()}` : ''}`);
  }

  return (
    <section className="home-panel">
      <div>
        <p className="eyebrow">커피 원두 검색 엔진</p>
        <h1>취향과 예산에 맞는 원두를 찾기</h1>
        <p className="lead">
          산미, 바디감, 컵노트, 가격 기준으로 원두를 탐색하는 MVP를 준비
          중입니다.
        </p>
      </div>
      <form className="hero-search" role="search" onSubmit={handleSubmit}>
        <label htmlFor="home-search">원두 검색</label>
        <div>
          <input
            id="home-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="라떼에 좋은 원두 검색"
          />
          <button type="submit">검색</button>
        </div>
      </form>
    </section>
  );
}
