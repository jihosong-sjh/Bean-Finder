import { Link, useNavigate } from 'react-router-dom';
import { getHomeApi } from '../api/bean-finder.api';
import { SearchInput } from '../components/search/SearchInput';

export function HomePage() {
  const navigate = useNavigate();
  const response = getHomeApi();
  const home = 'data' in response.body ? response.body.data : null;

  function handleSearch(query: string) {
    const params = new URLSearchParams();

    if (query) {
      params.set('q', query);
    }

    navigate(`/search${params.size ? `?${params.toString()}` : ''}`);
  }

  return (
    <div className="home-stack">
      <section className="home-panel">
        <div>
          <p className="eyebrow">커피 원두 검색 엔진</p>
          <h1>취향과 예산에 맞는 원두를 찾기</h1>
          <p className="lead">
            산미, 바디감, 컵노트, 가격 기준으로 지금 살 수 있는 원두를
            탐색합니다.
          </p>
        </div>
        <div className="hero-search">
          <SearchInput
            label="원두 검색"
            placeholder="라떼에 좋은 원두 검색"
            size="large"
            onSearch={handleSearch}
          />
          {home && (
            <div className="quick-links" aria-label="추천 검색어">
              {home.suggested_queries.map((query) => (
                <button
                  key={query}
                  type="button"
                  onClick={() => handleSearch(query)}
                >
                  {query}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      {home && (
        <section className="home-section">
          <div className="section-heading">
            <p className="eyebrow">취향 카테고리</p>
            <h2>맛으로 고르기</h2>
          </div>
          <div className="link-grid">
            {home.featured_categories.map((category) => (
              <Link key={category.key} to={`/categories/${category.key}`}>
                <strong>{category.title}</strong>
                <span>{category.description}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {home && (
        <section className="home-section">
          <div className="section-heading">
            <p className="eyebrow">랭킹</p>
            <h2>조건별 추천</h2>
          </div>
          <div className="link-grid link-grid--compact">
            {home.featured_rankings.map((ranking) => (
              <Link key={ranking.key} to={`/rankings/${ranking.key}`}>
                <strong>{ranking.title}</strong>
                <span>{ranking.description}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
