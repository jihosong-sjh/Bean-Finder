import type { Bean, BeanInput } from './bean.types';
import type { Roastery } from '../roasteries/roastery.types';
import type { TastingNote } from '../tasting-notes/tasting-note.types';

export function calculatePricePer100g(price: number, weightG: number) {
  if (price <= 0) {
    throw new Error('price must be greater than 0');
  }

  if (weightG <= 0) {
    throw new Error('weight_g must be greater than 0');
  }

  return Math.round((price / weightG) * 100);
}

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function createEasyTasteTags(
  bean: BeanInput,
  tastingNotes: TastingNote[],
) {
  const noteByKey = new Map(tastingNotes.map((note) => [note.key, note]));
  const tags = new Set<string>();
  const { acidity, sweetness, bitterness, body } = bean.taste_profile;

  if (acidity <= 2) tags.add('신맛 적음');
  if (acidity >= 4) tags.add('산미 있음');
  if (body <= 2) tags.add('가벼움');
  if (body >= 4) tags.add('묵직함');
  if (bitterness <= 2) tags.add('쓴맛 적음');
  if (sweetness >= 4) tags.add('단맛 좋음');
  if (bean.roast_level === 'dark') tags.add('진하고 쌉쌀함');
  if (bean.recommended_brew_methods.includes('latte')) tags.add('라떼용');
  if (bean.recommended_brew_methods.includes('hand_drip')) {
    tags.add('핸드드립용');
  }

  for (const noteKey of bean.tasting_notes) {
    const note = noteByKey.get(noteKey);

    if (note?.easy_tag) {
      tags.add(note.easy_tag);
    }
  }

  return [...tags];
}

export function createSearchText(
  bean: BeanInput,
  roastery: Roastery,
  tastingNotes: TastingNote[],
  easyTasteTags: string[],
) {
  const noteByKey = new Map(tastingNotes.map((note) => [note.key, note]));
  const noteLabels = bean.tasting_notes.flatMap((noteKey) => {
    const note = noteByKey.get(noteKey);
    return note
      ? [note.key, note.label_ko, note.label_en, ...note.aliases]
      : [noteKey];
  });

  return normalizeSearchText(
    [
      bean.name,
      bean.slug,
      roastery.name,
      roastery.name_en,
      bean.origin.country,
      bean.origin.region,
      bean.origin.farm,
      bean.origin.producer,
      bean.variety,
      bean.process,
      bean.roast_level,
      ...bean.recommended_brew_methods,
      ...noteLabels,
      ...easyTasteTags,
    ]
      .filter((value): value is string => Boolean(value))
      .join(' '),
  );
}

export function calculateDataCompletenessScore(bean: BeanInput) {
  const optionalFields = [
    bean.origin.country_code,
    bean.origin.region,
    bean.origin.farm,
    bean.origin.producer,
    bean.variety,
    bean.taste_profile.aroma,
    bean.taste_profile.balance,
    bean.media.image_url,
    bean.rating.average,
    bean.rating.count,
    bean.source.url,
  ];
  const completed = optionalFields.filter((value) => value !== null).length;

  return Math.round((completed / optionalFields.length) * 100);
}

export function enrichBean(
  bean: BeanInput,
  roastery: Roastery,
  tastingNotes: TastingNote[],
): Bean {
  const pricePer100g = calculatePricePer100g(
    bean.primary_package.price,
    bean.primary_package.weight_g,
  );
  const easyTasteTags = createEasyTasteTags(bean, tastingNotes);

  return {
    ...bean,
    primary_package: {
      ...bean.primary_package,
      price_per_100g: pricePer100g,
    },
    media: {
      ...bean.media,
      image_alt: bean.media.image_alt ?? `${roastery.name} ${bean.name}`,
    },
    easy_taste_tags: easyTasteTags,
    data_completeness_score: calculateDataCompletenessScore(bean),
    search_text: createSearchText(bean, roastery, tastingNotes, easyTasteTags),
  };
}
