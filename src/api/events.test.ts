import { describe, expect, it } from 'vitest';
import { trackEvent } from './events';
import type { EventName } from './event.types';

describe('trackEvent', () => {
  it('accepts valid events through the API helper', () => {
    expect(
      trackEvent({
        eventName: 'search_submitted',
        pagePath: '/search',
        occurredAt: '2026-05-08T12:00:00+09:00',
        properties: {
          query: '라떼',
        },
      }),
    ).toBe(true);
  });

  it('returns false instead of throwing when event logging is rejected', () => {
    expect(
      trackEvent({
        eventName: 'unknown_event' as EventName,
        pagePath: '/search',
      }),
    ).toBe(false);
  });
});
