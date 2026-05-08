export const COMPARE_STORAGE_KEY = 'bean_finder.compare_ids';
export const COMPARE_MAX_ITEMS = 4;

export type CompareAddResult = 'added' | 'duplicate' | 'limit_reached';

export function readCompareIds(storage: Storage = window.localStorage) {
  try {
    return sanitizeCompareIds(
      JSON.parse(storage.getItem(COMPARE_STORAGE_KEY) ?? '[]'),
    );
  } catch {
    return [];
  }
}

export function writeCompareIds(
  ids: string[],
  storage: Storage = window.localStorage,
) {
  const nextIds = sanitizeCompareIds(ids);
  storage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(nextIds));

  return nextIds;
}

export function addCompareId(
  currentIds: string[],
  beanId: string,
): { ids: string[]; result: CompareAddResult } {
  const ids = sanitizeCompareIds(currentIds);
  const normalizedBeanId = beanId.trim();

  if (!normalizedBeanId) {
    return { ids, result: 'duplicate' };
  }

  if (ids.includes(normalizedBeanId)) {
    return { ids, result: 'duplicate' };
  }

  if (ids.length >= COMPARE_MAX_ITEMS) {
    return { ids, result: 'limit_reached' };
  }

  return { ids: [...ids, normalizedBeanId], result: 'added' };
}

export function removeCompareId(currentIds: string[], beanId: string) {
  return sanitizeCompareIds(currentIds).filter((id) => id !== beanId);
}

export function clearCompareIds(storage: Storage = window.localStorage) {
  storage.removeItem(COMPARE_STORAGE_KEY);

  return [];
}

function sanitizeCompareIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value)]
    .filter((id): id is string => typeof id === 'string')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, COMPARE_MAX_ITEMS);
}
