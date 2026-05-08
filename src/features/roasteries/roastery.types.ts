export type Roastery = {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  location: {
    country: string | null;
    city: string | null;
    address: string | null;
  };
  social_links: {
    instagram: string | null;
    youtube: string | null;
  };
  created_at: string;
  updated_at: string;
};
