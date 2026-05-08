import { z } from 'zod';
import type { BeanInput } from './bean.types';
import type { Category } from '../categories/category.types';
import type { Ranking } from '../rankings/ranking.types';
import type { Roastery } from '../roasteries/roastery.types';
import type { TastingNote } from '../tasting-notes/tasting-note.types';

const idSchema = z.string().regex(/^[a-z0-9_]+$/);
const slugSchema = z.string().regex(/^[a-z0-9-]+$/);
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !isFutureDate(value), {
    message: 'Date must not be in the future',
  });
const isoDateTimeSchema = z.string().datetime({ offset: true });
const nullableUrlSchema = z.string().url().nullable();
const scoreSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const roasterySchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: z.string().min(1),
  name_en: z.string().min(1).nullable(),
  description: z.string().min(1).nullable(),
  website_url: nullableUrlSchema,
  logo_url: nullableUrlSchema,
  location: z.object({
    country: z.string().min(1).nullable(),
    city: z.string().min(1).nullable(),
    address: z.string().min(1).nullable(),
  }),
  social_links: z.object({
    instagram: nullableUrlSchema,
    youtube: nullableUrlSchema,
  }),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
}) satisfies z.ZodType<Roastery>;

export const tastingNoteSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]+$/),
  label_ko: z.string().min(1),
  label_en: z.string().min(1),
  group: z.enum([
    'fruit',
    'berry',
    'floral',
    'nut',
    'chocolate',
    'sweet',
    'spice',
    'herbal',
    'roasted',
    'other',
  ]),
  aliases: z.array(z.string().min(1)),
  easy_tag: z.string().min(1).nullable(),
}) satisfies z.ZodType<TastingNote>;

export const beanInputSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: z.string().min(1),
  roastery_id: idSchema,
  origin: z.object({
    country: z.string().min(1),
    country_code: z.string().length(2).nullable(),
    region: z.string().min(1).nullable(),
    farm: z.string().min(1).nullable(),
    producer: z.string().min(1).nullable(),
  }),
  variety: z.string().min(1).nullable(),
  process: z.enum([
    'washed',
    'natural',
    'honey',
    'anaerobic',
    'semi_washed',
    'blend',
    'unknown',
  ]),
  roast_level: z.enum(['light', 'medium', 'medium_dark', 'dark']),
  tasting_notes: z.array(z.string().regex(/^[a-z0-9_]+$/)).min(1),
  taste_profile: z.object({
    acidity: scoreSchema,
    sweetness: scoreSchema,
    bitterness: scoreSchema,
    body: scoreSchema,
    aroma: scoreSchema.nullable(),
    balance: scoreSchema.nullable(),
  }),
  recommended_brew_methods: z
    .array(
      z.enum([
        'hand_drip',
        'espresso',
        'latte',
        'cold_brew',
        'moka_pot',
        'french_press',
      ]),
    )
    .min(1),
  primary_package: z.object({
    price: z.number().int().positive(),
    weight_g: z.number().int().positive(),
    currency: z.literal('KRW'),
    product_url: z.string().url(),
    affiliate_url: nullableUrlSchema,
    package_label: z.string().min(1).nullable(),
  }),
  media: z.object({
    image_url: nullableUrlSchema,
    image_alt: z.string().min(1).nullable(),
  }),
  rating: z.object({
    average: z.number().min(0).max(5).nullable(),
    count: z.number().int().nonnegative().nullable(),
    source: z.string().min(1).nullable(),
  }),
  flags: z.object({
    is_decaf: z.boolean(),
    is_available: z.boolean(),
    is_blend: z.boolean(),
    is_featured: z.boolean(),
  }),
  source: z.object({
    type: z.enum([
      'roastery_official',
      'marketplace',
      'operator_tagging',
      'user_feedback',
    ]),
    name: z.string().min(1),
    url: nullableUrlSchema,
    last_checked_at: dateSchema,
    tagged_by: z.string().min(1).nullable(),
  }),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
}) satisfies z.ZodType<BeanInput>;

export const categorySchema = z.object({
  key: slugSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  default_filters: z.record(z.unknown()),
  default_sort: z.string().min(1),
  is_active: z.boolean(),
  display_order: z.number().int().positive(),
}) satisfies z.ZodType<Category>;

export const rankingSchema = z.object({
  key: slugSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  filters: z.record(z.unknown()),
  sort: z.object({
    field: z.enum([
      'price_per_100g',
      'recommendation_score',
      'acidity',
      'body',
      'price',
    ]),
    direction: z.enum(['asc', 'desc']),
  }),
  limit: z.number().int().positive(),
  is_active: z.boolean(),
  display_order: z.number().int().positive(),
}) satisfies z.ZodType<Ranking>;

export const dataStoreSchema = z.object({
  beans: z.array(beanInputSchema).min(30).max(50),
  roasteries: z.array(roasterySchema).min(5),
  tastingNotes: z.array(tastingNoteSchema).min(1),
  categories: z.array(categorySchema).min(1),
  rankings: z.array(rankingSchema).min(1),
});

export type DataStoreInput = z.infer<typeof dataStoreSchema>;

export function assertUnique(values: string[], label: string) {
  const duplicates = values.filter(
    (value, index) => values.indexOf(value) !== index,
  );

  if (duplicates.length > 0) {
    throw new Error(
      `${label} contains duplicate values: ${[...new Set(duplicates)].join(', ')}`,
    );
  }
}

function isFutureDate(value: string) {
  const timestamp = Date.parse(`${value}T00:00:00Z`);

  if (!Number.isFinite(timestamp)) {
    return true;
  }

  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  return timestamp > todayUtc;
}
