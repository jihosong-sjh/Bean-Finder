import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { COMPARE_STORAGE_KEY } from '../features/compare/compare.storage';
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

describe('M5 pages', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('adds a bean to compare storage from a card and shows the mini bar', async () => {
    const user = userEvent.setup();
    renderRoute('/search');

    await user.click(screen.getAllByRole('button', { name: '비교함 추가' })[0]);

    expect(screen.getByText('비교함 1/4')).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(COMPARE_STORAGE_KEY) ?? '[]'),
    ).toHaveLength(1);
    expect(
      screen.getAllByRole('button', { name: '비교함 제거' }).length,
    ).toBeGreaterThan(0);
  });

  it('renders compare table and removes a bean', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      COMPARE_STORAGE_KEY,
      JSON.stringify([
        'bean_fritz_daily_blend_001',
        'bean_beanbrothers_brazil_value_001',
      ]),
    );
    renderRoute('/compare');

    expect(
      screen.getByRole('heading', { name: '원두 비교' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('100g당 가격')[0]).toBeInTheDocument();
    expect(screen.getAllByText('컵노트')[0]).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: '제거' })[0]);

    expect(
      JSON.parse(window.localStorage.getItem(COMPARE_STORAGE_KEY) ?? '[]'),
    ).toHaveLength(1);
  });

  it('renders category filters and handles unknown category keys', async () => {
    const user = userEvent.setup();
    const router = renderRoute('/categories/low-acidity');

    expect(
      screen.getByRole('heading', { name: '신맛 적은 원두' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /카테고리 조건:/ }));

    expect(router.state.location.search).toContain(
      'include_category_filter=false',
    );

    renderRoute('/categories/missing-category');
    expect(
      screen.getByRole('heading', { name: '카테고리를 찾을 수 없습니다' }),
    ).toBeInTheDocument();
  });

  it('renders ranking criteria and handles unknown ranking keys', () => {
    renderRoute('/rankings/price-per-100g');

    expect(
      screen.getByRole('heading', { name: '100g당 가격 낮은 원두' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/기준:/)).toBeInTheDocument();
    expect(screen.getAllByText('1')[0]).toBeInTheDocument();

    renderRoute('/rankings/missing-ranking');
    expect(
      screen.getByRole('heading', { name: '랭킹을 찾을 수 없습니다' }),
    ).toBeInTheDocument();
  });
});
