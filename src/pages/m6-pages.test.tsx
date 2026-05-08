import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppLayout } from '../components/layout/AppLayout';
import { BeanDetailPage } from './BeanDetailPage';
import { CategoryPage } from './CategoryPage';
import { ComparePage } from './ComparePage';
import { HomePage } from './HomePage';
import { RankingPage } from './RankingPage';
import { SearchPage } from './SearchPage';

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

  return router;
}

describe('M6 UX enhancements', () => {
  it('opens and closes the filter drawer from search results', async () => {
    const user = userEvent.setup();
    renderRoute('/search');

    await user.click(screen.getByRole('button', { name: '필터' }));

    expect(screen.getByRole('dialog', { name: '필터' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(
      screen.queryByRole('dialog', { name: '필터' }),
    ).not.toBeInTheDocument();
  });

  it('keeps navigation actions available for API query errors', () => {
    renderRoute('/search?price_per_100g_min=12000&price_per_100g_max=8000');

    expect(
      screen.getByRole('heading', { name: '검색 조건을 확인해 주세요' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '전체 원두 보기' }),
    ).toHaveAttribute('href', '/search');
    expect(screen.getByRole('link', { name: '홈으로 이동' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('renders detail image fallback with accessible alt text', () => {
    renderRoute('/beans/fritz-daily-blend');

    expect(
      screen.getByRole('img', { name: '프릳츠 데일리 블렌드' }),
    ).toBeInTheDocument();
  });
});
