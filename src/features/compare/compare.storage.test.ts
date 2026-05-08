import { beforeEach, describe, expect, it } from 'vitest';
import {
  addCompareId,
  clearCompareIds,
  COMPARE_MAX_ITEMS,
  COMPARE_STORAGE_KEY,
  readCompareIds,
  removeCompareId,
  writeCompareIds,
} from './compare.storage';

describe('compare storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists sanitized ids in localStorage', () => {
    const ids = writeCompareIds([
      'bean_a',
      'bean_b',
      'bean_a',
      '',
      'bean_c',
      'bean_d',
      'bean_e',
    ]);

    expect(ids).toEqual(['bean_a', 'bean_b', 'bean_c', 'bean_d']);
    expect(readCompareIds()).toEqual(['bean_a', 'bean_b', 'bean_c', 'bean_d']);
  });

  it('adds unique ids up to the maximum limit', () => {
    const fullIds = ['bean_a', 'bean_b', 'bean_c', 'bean_d'];

    expect(addCompareId(['bean_a'], 'bean_a')).toEqual({
      ids: ['bean_a'],
      result: 'duplicate',
    });
    expect(addCompareId(['bean_a'], 'bean_b')).toEqual({
      ids: ['bean_a', 'bean_b'],
      result: 'added',
    });
    expect(addCompareId(fullIds, 'bean_e')).toEqual({
      ids: fullIds,
      result: 'limit_reached',
    });
    expect(fullIds).toHaveLength(COMPARE_MAX_ITEMS);
  });

  it('removes and clears ids', () => {
    writeCompareIds(['bean_a', 'bean_b']);

    expect(removeCompareId(readCompareIds(), 'bean_a')).toEqual(['bean_b']);
    expect(clearCompareIds()).toEqual([]);
    expect(window.localStorage.getItem(COMPARE_STORAGE_KEY)).toBeNull();
  });
});
