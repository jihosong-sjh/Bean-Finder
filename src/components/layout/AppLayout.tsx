import { FormEvent, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/search', label: '검색' },
  { to: '/categories/daily', label: '카테고리' },
  { to: '/rankings/value', label: '랭킹' },
  { to: '/compare', label: '비교함' },
];

export function AppLayout() {
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
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Bean Finder 홈">
          Bean Finder
        </Link>
        <form className="header-search" role="search" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="global-search">
            원두 검색
          </label>
          <input
            id="global-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="신맛 적은 원두 검색"
          />
          <button type="submit">검색</button>
        </form>
        <nav className="main-nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="page-frame">
        <Outlet />
      </main>
    </div>
  );
}
