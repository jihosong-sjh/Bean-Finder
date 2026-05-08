import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppLayout } from './components/layout/AppLayout';
import { BeanDetailPage } from './pages/BeanDetailPage';
import { CategoryPage } from './pages/CategoryPage';
import { ComparePage } from './pages/ComparePage';
import { HomePage } from './pages/HomePage';
import { RankingPage } from './pages/RankingPage';
import { SearchPage } from './pages/SearchPage';

function renderRoute(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'search', element: <SearchPage /> },
          { path: 'beans/:beanId', element: <BeanDetailPage /> },
          { path: 'compare', element: <ComparePage /> },
          { path: 'categories/:categoryKey', element: <CategoryPage /> },
          { path: 'rankings/:rankingKey', element: <RankingPage /> },
        ],
      },
    ],
    {
      initialEntries: [path],
      future: {
        v7_relativeSplatPath: true,
      },
    },
  );

  render(<RouterProvider router={router} />);
}

describe('M0 routes', () => {
  it('renders the home route', () => {
    renderRoute('/');

    expect(
      screen.getByRole('heading', { name: /취향과 예산/ }),
    ).toBeInTheDocument();
  });

  it.each([
    ['/search?q=라떼', '라떼'],
    ['/beans/sample-bean', 'sample-bean'],
    ['/compare', '원두 비교'],
    ['/categories/daily', 'daily'],
    ['/rankings/value', 'value'],
  ])('renders %s', (path, heading) => {
    renderRoute(path);

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  });
});
