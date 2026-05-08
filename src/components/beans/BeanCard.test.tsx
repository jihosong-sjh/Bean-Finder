import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { BeanCard as BeanCardModel } from '../../features/beans/bean.search';
import { BeanCard } from './BeanCard';

const bean: BeanCardModel = {
  id: 'bean_fritz_daily_blend_001',
  slug: 'fritz-daily-blend',
  name: '데일리 블렌드',
  roastery: {
    id: 'roastery_fritz',
    name: '프릳츠',
  },
  origin: {
    country: 'Blend',
    region: 'Brazil, Colombia',
  },
  roast_level: {
    key: 'medium_dark',
    label: '미디엄 다크',
  },
  price: 18000,
  weight_g: 200,
  price_per_100g: 9000,
  currency: 'KRW',
  taste_summary: {
    acidity: {
      score: 2,
      label: '낮음',
    },
    body: {
      score: 4,
      label: '높음',
    },
  },
  tasting_notes: [
    { key: 'chocolate', label: '초콜릿' },
    { key: 'nutty', label: '견과' },
    { key: 'caramel', label: '캐러멜' },
  ],
  easy_taste_tags: ['신맛 적음'],
  recommended_brew_methods: [
    { key: 'espresso', label: '에스프레소' },
    { key: 'latte', label: '라떼' },
  ],
  image_url: null,
  image_alt: '프릳츠 데일리 블렌드',
  is_decaf: false,
  is_available: true,
  product_url: 'https://example.com/products/fritz-daily-blend',
};

describe('BeanCard', () => {
  it('renders required card information and actions', async () => {
    const user = userEvent.setup();
    const onOutboundClick = vi.fn();

    render(
      <MemoryRouter>
        <BeanCard bean={bean} onOutboundClick={onOutboundClick} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: '데일리 블렌드' }),
    ).toBeInTheDocument();
    expect(screen.getByText('18,000원 · 200g')).toBeInTheDocument();
    expect(screen.getByText('100g당 9,000원')).toBeInTheDocument();
    expect(screen.getByText('산미')).toBeInTheDocument();
    expect(screen.getByText('바디감')).toBeInTheDocument();
    expect(screen.getByText('초콜릿')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: '프릳츠 데일리 블렌드' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '비교함 추가' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: '판매처 이동' }));

    expect(onOutboundClick).toHaveBeenCalledWith(bean);
  });
});
