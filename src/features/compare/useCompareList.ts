import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { postEventApi } from '../../api/bean-finder.api';
import {
  addCompareId,
  clearCompareIds,
  COMPARE_MAX_ITEMS,
  COMPARE_STORAGE_KEY,
  readCompareIds,
  removeCompareId,
  writeCompareIds,
} from './compare.storage';

type CompareListener = () => void;

const listeners = new Set<CompareListener>();
let cachedRawValue = readRawValueFromBrowser();
let cachedIds = readIdsFromBrowser();

function readIdsFromBrowser() {
  if (typeof window === 'undefined') {
    return [];
  }

  return readCompareIds(window.localStorage);
}

function readRawValueFromBrowser() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(COMPARE_STORAGE_KEY);
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: CompareListener) {
  listeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key && event.key !== COMPARE_STORAGE_KEY) {
      return;
    }

    cachedRawValue = readRawValueFromBrowser();
    cachedIds = readIdsFromBrowser();
    emitChange();
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

function getSnapshot() {
  const rawValue = readRawValueFromBrowser();

  if (rawValue !== cachedRawValue) {
    cachedRawValue = rawValue;
    cachedIds = readIdsFromBrowser();
  }

  return cachedIds;
}

function getServerSnapshot() {
  return [];
}

function setCompareIds(ids: string[]) {
  cachedIds =
    typeof window === 'undefined'
      ? ids
      : writeCompareIds(ids, window.localStorage);
  cachedRawValue = readRawValueFromBrowser();
  emitChange();
}

export function useCompareList() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback(
    (beanId: string) => {
      const result = addCompareId(ids, beanId);

      if (result.result === 'added') {
        setCompareIds(result.ids);
        trackCompareEvent('compare_added', beanId, result.ids.length);
      }

      return result.result;
    },
    [ids],
  );

  const remove = useCallback(
    (beanId: string) => {
      const nextIds = removeCompareId(ids, beanId);

      if (nextIds.length !== ids.length) {
        setCompareIds(nextIds);
        trackCompareEvent('compare_removed', beanId, nextIds.length);
      }
    },
    [ids],
  );

  const toggle = useCallback(
    (beanId: string) => {
      if (ids.includes(beanId)) {
        remove(beanId);
        return 'removed' as const;
      }

      return add(beanId);
    },
    [add, ids, remove],
  );

  const clear = useCallback(() => {
    if (typeof window !== 'undefined') {
      clearCompareIds(window.localStorage);
    }

    cachedRawValue = readRawValueFromBrowser();
    cachedIds = [];
    emitChange();
  }, []);

  return useMemo(
    () => ({
      ids,
      count: ids.length,
      max: COMPARE_MAX_ITEMS,
      isFull: ids.length >= COMPARE_MAX_ITEMS,
      has: (beanId: string) => ids.includes(beanId),
      add,
      remove,
      toggle,
      clear,
    }),
    [add, clear, ids, remove, toggle],
  );
}

function trackCompareEvent(
  eventName: 'compare_added' | 'compare_removed',
  beanId: string,
  compareCount: number,
) {
  if (typeof window === 'undefined') {
    return;
  }

  postEventApi({
    event_name: eventName,
    occurred_at: new Date().toISOString(),
    page_path: window.location.pathname,
    properties: {
      bean_id: beanId,
      compare_count: compareCount,
    },
  });
}
