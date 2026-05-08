import { readFileSync } from 'node:fs';
import { render, screen, within } from '@testing-library/react';
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
  const view = render(<RouterProvider router={router} />);

  return { router, ...view };
}

describe('M7 core E2E flows', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('explores low-acidity beans from a category page', () => {
    const { container } = renderRoute('/categories/low-acidity');
    const cards = getBeanCards(container);

    expect(
      screen.getByRole('heading', { name: '신맛 적은 원두' }),
    ).toBeInTheDocument();
    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      expect(within(card).getByText(/100g당/)).toBeInTheDocument();
      expect(card.querySelector('.taste-score__value')?.textContent).toMatch(
        /^[12]\/5/,
      );
    }
  });

  it('searches latte beans, applies a heavy-body filter, and compares three beans', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/');

    await user.type(
      screen.getByPlaceholderText('라떼에 좋은 원두 검색'),
      '라떼에 좋은 원두',
    );
    await user.click(screen.getAllByRole('button', { name: '검색' })[1]);
    await user.click(screen.getByLabelText('묵직함'));

    expect(router.state.location.pathname).toBe('/search');
    expect(router.state.location.search).toContain('body=heavy');

    for (let index = 0; index < 3; index += 1) {
      await user.click(
        screen.getAllByRole('button', { name: '비교함 추가' })[0],
      );
    }

    expect(screen.getByText('비교함 3/4')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: '비교하기' }));

    expect(
      screen.getByRole('heading', { name: '원두 비교' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('100g당 가격')[0]).toBeInTheDocument();
    expect(screen.getAllByText('산미')[0]).toBeInTheDocument();
    expect(screen.getAllByText('바디감')[0]).toBeInTheDocument();
    expect(screen.getAllByText('컵노트')[0]).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(COMPARE_STORAGE_KEY) ?? '[]'),
    ).toHaveLength(3);
  });

  it('shows search results sorted by price per 100g', () => {
    const { container } = renderRoute(
      '/search?sort=price_per_100g_asc&limit=50',
    );
    const prices = Array.from(
      container.querySelectorAll<HTMLElement>('.bean-card__unit-price'),
    ).map((element) => parsePrice(element.textContent ?? ''));

    expect(prices.length).toBeGreaterThan(0);
    expect(
      prices.every((price, index) => {
        const previous = prices[index - 1];
        return previous === undefined || previous <= price;
      }),
    ).toBe(true);
  });

  it('recovers from empty results by clearing filters while keeping the query', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/search?q=라떼&price_max=1');
    const emptyHeading = screen.getByRole('heading', {
      name: '조건에 맞는 원두를 찾지 못했습니다',
    });

    expect(emptyHeading).toBeInTheDocument();

    await user.click(
      within(emptyHeading.closest('section') as HTMLElement).getByRole(
        'button',
        { name: '필터 초기화' },
      ),
    );

    expect(router.state.location.search).toContain('q=%EB%9D%BC%EB%96%BC');
    expect(router.state.location.search).not.toContain('price_max=1');
    expect(
      screen.getAllByRole('button', { name: '비교함 추가' }).length,
    ).toBeGreaterThan(0);
  });

  it('keeps the seller link usable from detail', () => {
    renderRoute('/beans/fritz-daily-blend');
    const sellerLink = screen.getAllByRole('link', { name: '판매처 이동' })[0];

    expect(sellerLink).toMatchObject({
      target: '_blank',
    });
    expect(sellerLink).toHaveAttribute(
      'href',
      'https://example.com/products/fritz-daily-blend',
    );
  });
});

describe('M7 accessibility checks', () => {
  it('provides named navigation, search, images, buttons, and links on core pages', () => {
    const { container } = renderRoute('/search?q=라떼&limit=5');

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: '주요 메뉴' }),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText('원두 검색').length).toBeGreaterThan(0);
    expectAllNamed(container, 'button');
    expectAllNamed(container, 'link');
    expectAllNamed(container, 'img');
  });

  it('moves focus into the mobile filter drawer and closes it with Escape', async () => {
    const user = userEvent.setup();
    renderRoute('/search');

    await user.click(screen.getByRole('button', { name: '필터' }));

    const dialog = screen.getByRole('dialog', { name: '필터' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('dialog', { name: '필터' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '필터' })).toHaveFocus();
  });

  it('exposes taste scores with text, not color alone', () => {
    renderRoute('/beans/fritz-daily-blend');

    expect(screen.getAllByText('2/5 낮음').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4/5 높음').length).toBeGreaterThan(0);
  });
});

describe('M7 responsive QA', () => {
  it.each([
    ['mobile', 390, 844],
    ['tablet', 768, 1024],
    ['desktop', 1440, 900],
  ])('renders critical search controls at %s viewport', (_, width, height) => {
    setViewport(width, height);
    renderRoute('/search?limit=5');

    expect(screen.getByRole('button', { name: '필터' })).toBeInTheDocument();
    expect(screen.getByLabelText('정렬')).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: '원두 목록' }),
    ).toBeInTheDocument();
  });

  it('keeps both desktop and mobile compare structures available for CSS breakpoints', () => {
    window.localStorage.setItem(
      COMPARE_STORAGE_KEY,
      JSON.stringify([
        'bean_fritz_daily_blend_001',
        'bean_beanbrothers_brazil_value_001',
      ]),
    );

    renderRoute('/compare');

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByLabelText('모바일 비교 목록')).toBeInTheDocument();
  });

  it('keeps responsive breakpoint rules for mobile, tablet, and desktop QA', () => {
    const styles = readFileSync(`${process.cwd()}/src/styles.css`, {
      encoding: 'utf8',
    });

    expect(styles).toContain('@media (max-width: 1023px)');
    expect(styles).toContain('@media (max-width: 767px)');
    expect(styles).toContain(
      '.bean-grid {\n    grid-template-columns: repeat(2',
    );
    expect(styles).toContain('.bean-grid {\n    grid-template-columns: 1fr');
    expect(styles).toContain('.filter-panel--drawer-open');
    expect(styles).toContain('.compare-table-wrap {\n    display: none;');
    expect(styles).toContain('.compare-mobile-list {\n    display: grid;');
  });
});

function getBeanCards(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('.bean-card'));
}

function parsePrice(value: string) {
  return Number(value.replace(/[^\d]/g, ''));
}

function expectAllNamed(
  container: HTMLElement,
  role: 'button' | 'link' | 'img',
) {
  for (const element of within(container).getAllByRole(role)) {
    expect(element).toHaveAccessibleName();
  }
}

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
}
