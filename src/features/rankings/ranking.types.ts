import type { BrewMethod } from '../beans/bean.types';

export type RankingFilter = {
  is_available?: boolean;
  price_max?: number;
  acidity?: 'low' | 'high';
  acidity_max?: number;
  bitterness_max?: number;
  brew_method?: BrewMethod[];
};

export type RankingSort = {
  field:
    | 'price_per_100g'
    | 'recommendation_score'
    | 'acidity'
    | 'body'
    | 'price';
  direction: 'asc' | 'desc';
};

export type Ranking = {
  key: string;
  title: string;
  description: string;
  filters: RankingFilter;
  sort: RankingSort;
  limit: number;
  is_active: boolean;
  display_order: number;
};
