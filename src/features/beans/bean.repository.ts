import beans from '../../../data/beans.json';
import categories from '../../../data/categories.json';
import rankings from '../../../data/rankings.json';
import roasteries from '../../../data/roasteries.json';
import tastingNotes from '../../../data/tasting_notes.json';
import { enrichBean } from './bean.derived';
import {
  assertUnique,
  beanInputSchema,
  categorySchema,
  rankingSchema,
  roasterySchema,
  tastingNoteSchema,
} from './bean.validation';

export function loadBeanData() {
  const parsedRoasteries = roasterySchema.array().parse(roasteries);
  const parsedTastingNotes = tastingNoteSchema.array().parse(tastingNotes);
  const parsedBeanInputs = beanInputSchema.array().parse(beans);
  const parsedCategories = categorySchema.array().parse(categories);
  const parsedRankings = rankingSchema.array().parse(rankings);

  assertUnique(
    parsedRoasteries.map((roastery) => roastery.id),
    'roastery ids',
  );
  assertUnique(
    parsedTastingNotes.map((note) => note.key),
    'tasting note keys',
  );
  assertUnique(
    parsedBeanInputs.map((bean) => bean.id),
    'bean ids',
  );
  assertUnique(
    parsedBeanInputs.map((bean) => bean.slug),
    'bean slugs',
  );
  assertUnique(
    parsedCategories.map((category) => category.key),
    'category keys',
  );
  assertUnique(
    parsedRankings.map((ranking) => ranking.key),
    'ranking keys',
  );

  const roasteryById = new Map(
    parsedRoasteries.map((roastery) => [roastery.id, roastery]),
  );
  const tastingNoteKeys = new Set(parsedTastingNotes.map((note) => note.key));

  const parsedBeans = parsedBeanInputs.map((bean) => {
    const roastery = roasteryById.get(bean.roastery_id);

    if (!roastery) {
      throw new Error(
        `${bean.id} references unknown roastery_id ${bean.roastery_id}`,
      );
    }

    for (const noteKey of bean.tasting_notes) {
      if (!tastingNoteKeys.has(noteKey)) {
        throw new Error(
          `${bean.id} references unknown tasting note ${noteKey}`,
        );
      }
    }

    return enrichBean(bean, roastery, parsedTastingNotes);
  });

  return {
    beans: parsedBeans,
    roasteries: parsedRoasteries,
    tastingNotes: parsedTastingNotes,
    categories: parsedCategories,
    rankings: parsedRankings,
  };
}

export function findBeanById(beanId: string) {
  return loadBeanData().beans.find((bean) => bean.id === beanId) ?? null;
}
