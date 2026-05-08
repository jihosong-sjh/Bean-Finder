export type RoastLevel = 'light' | 'medium' | 'medium_dark' | 'dark';

export type Process =
  | 'washed'
  | 'natural'
  | 'honey'
  | 'anaerobic'
  | 'semi_washed'
  | 'blend'
  | 'unknown';

export type BrewMethod =
  | 'hand_drip'
  | 'espresso'
  | 'latte'
  | 'cold_brew'
  | 'moka_pot'
  | 'french_press';

export type SourceType =
  | 'roastery_official'
  | 'marketplace'
  | 'operator_tagging'
  | 'user_feedback';

export type TastingNoteGroup =
  | 'fruit'
  | 'berry'
  | 'floral'
  | 'nut'
  | 'chocolate'
  | 'sweet'
  | 'spice'
  | 'herbal'
  | 'roasted'
  | 'other';

export type Score = 1 | 2 | 3 | 4 | 5;

export type Origin = {
  country: string;
  country_code: string | null;
  region: string | null;
  farm: string | null;
  producer: string | null;
};

export type TasteProfile = {
  acidity: Score;
  sweetness: Score;
  bitterness: Score;
  body: Score;
  aroma: Score | null;
  balance: Score | null;
};

export type PrimaryPackageInput = {
  price: number;
  weight_g: number;
  currency: 'KRW';
  product_url: string;
  affiliate_url: string | null;
  package_label: string | null;
};

export type PrimaryPackage = PrimaryPackageInput & {
  price_per_100g: number;
};

export type BeanMedia = {
  image_url: string | null;
  image_alt: string | null;
};

export type BeanRating = {
  average: number | null;
  count: number | null;
  source: string | null;
};

export type BeanFlags = {
  is_decaf: boolean;
  is_available: boolean;
  is_blend: boolean;
  is_featured: boolean;
};

export type BeanSource = {
  type: SourceType;
  name: string;
  url: string | null;
  last_checked_at: string;
  tagged_by: string | null;
};

export type BeanInput = {
  id: string;
  slug: string;
  name: string;
  roastery_id: string;
  origin: Origin;
  variety: string | null;
  process: Process;
  roast_level: RoastLevel;
  tasting_notes: string[];
  taste_profile: TasteProfile;
  recommended_brew_methods: BrewMethod[];
  primary_package: PrimaryPackageInput;
  media: BeanMedia;
  rating: BeanRating;
  flags: BeanFlags;
  source: BeanSource;
  created_at: string;
  updated_at: string;
};

export type Bean = Omit<BeanInput, 'primary_package'> & {
  primary_package: PrimaryPackage;
  easy_taste_tags: string[];
  data_completeness_score: number;
  search_text: string;
};
