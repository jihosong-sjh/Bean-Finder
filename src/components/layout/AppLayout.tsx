import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { CompareMiniBar } from '../compare/CompareMiniBar';
import { SearchInput } from '../search/SearchInput';

const navItems = [
  { to: '/search', label: '검색' },
  { to: '/categories/low-acidity', label: '카테고리' },
  { to: '/rankings/price-per-100g', label: '랭킹' },
  { to: '/compare', label: '비교함' },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentQuery = new URLSearchParams(location.search).get('q') ?? '';

  function handleSearch(query: string) {
    const params = new URLSearchParams();

    if (query) {
      params.set('q', query);
    }

    navigate(`/search${params.size ? `?${params.toString()}` : ''}`);
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Bean Finder 홈">
          Bean Finder
        </Link>
        <SearchInput
          defaultValue={currentQuery}
          placeholder="신맛 적은 원두 검색"
          onSearch={handleSearch}
        />
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
      <CompareMiniBar />
    </div>
  );
}
