import { postEventApi } from './bean-finder.api';
import type { TrackEvent, TrackEventInput } from './event.types';

export type {
  EventName,
  EventProperties,
  TrackEvent,
  TrackEventInput,
} from './event.types';

export const trackEvent: TrackEvent = (event: TrackEventInput) => {
  try {
    const pagePath = event.pagePath ?? getCurrentPagePath();

    if (!pagePath) {
      return false;
    }

    const result = postEventApi({
      event_name: event.eventName,
      occurred_at: event.occurredAt ?? new Date().toISOString(),
      page_path: pagePath,
      ...(event.properties ? { properties: event.properties } : {}),
    });

    return 'data' in result.body && result.body.data.accepted === true;
  } catch {
    return false;
  }
};

function getCurrentPagePath() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.pathname;
}
