import type { BrewMethod } from '../beans/bean.types';

export type CategoryFilter = {
  acidity?: 'low' | 'high';
  body?: 'light' | 'heavy';
  tasting_note_groups?: string[];
  brew_method?: BrewMethod[];
  price_max?: number;
  price_per_100g_percentile?: 'bottom_30';
  is_decaf?: boolean;
};

export type Category = {
  key: string;
  title: string;
  description: string;
  default_filters: CategoryFilter;
  default_sort: string;
  is_active: boolean;
  display_order: number;
};
