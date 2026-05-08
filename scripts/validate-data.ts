import { loadBeanData } from '../src/features/beans/bean.repository';

const data = loadBeanData();
const missingPricePer100g = data.beans.filter(
  (bean) => !Number.isInteger(bean.primary_package.price_per_100g),
);
const missingSearchText = data.beans.filter(
  (bean) => bean.search_text.length === 0,
);

if (missingPricePer100g.length > 0) {
  throw new Error(
    `price_per_100g was not calculated for: ${missingPricePer100g
      .map((bean) => bean.id)
      .join(', ')}`,
  );
}

if (missingSearchText.length > 0) {
  throw new Error(
    `search_text was not generated for: ${missingSearchText
      .map((bean) => bean.id)
      .join(', ')}`,
  );
}

console.log(
  [
    'Data validation passed.',
    `beans=${data.beans.length}`,
    `roasteries=${data.roasteries.length}`,
    `tasting_notes=${data.tastingNotes.length}`,
    `categories=${data.categories.length}`,
    `rankings=${data.rankings.length}`,
  ].join(' '),
);
