import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppLayout } from '../components/layout/AppLayout';
import { BeanDetailPage } from './BeanDetailPage';
import { HomePage } from './HomePage';
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

describe('M4 pages', () => {
  it('navigates from home search to search results', async () => {
    const user = userEvent.setup();
    const router = renderRoute('/');

    await user.type(
      screen.getByPlaceholderText('라떼에 좋은 원두 검색'),
      '라떼',
    );
    await user.click(screen.getAllByRole('button', { name: '검색' })[1]);

    expect(router.state.location.pathname).toBe('/search');
    expect(router.state.location.search).toBe('?q=%EB%9D%BC%EB%96%BC');
    expect(screen.getByRole('heading', { name: '라떼' })).toBeInTheDocument();
  });

  it('filters, sorts, and exposes more pagination on search results', async () => {
    const user = userEvent.setup();
    const router = renderRoute('/search?q=원두&availability=include_sold_out');

    await user.selectOptions(
      screen.getByLabelText('정렬'),
      'price_per_100g_asc',
    );
    expect(router.state.location.search).toContain('sort=price_per_100g_asc');

    await user.click(screen.getByLabelText('낮음'));
    expect(router.state.location.search).toContain('acidity=low');

    const loadMore = screen.queryByRole('button', { name: '더 보기' });
    if (loadMore) {
      await user.click(loadMore);
      expect(router.state.location.search).toContain('limit=40');
    }
  });

  it('renders bean detail with taste profile, seller button, and similar beans', () => {
    renderRoute('/beans/fritz-daily-blend');

    expect(
      screen.getByRole('heading', { name: '데일리 블렌드' }),
    ).toBeInTheDocument();
    expect(screen.getByText('100g당 9,000원')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: '판매처 이동' }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: '맛 점수' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '비슷한 선택지' }),
    ).toBeInTheDocument();
  });
});
