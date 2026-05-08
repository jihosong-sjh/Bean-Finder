export const eventNames = [
  'search_submitted',
  'filter_changed',
  'sort_changed',
  'bean_card_clicked',
  'bean_detail_viewed',
  'compare_added',
  'compare_removed',
  'compare_viewed',
  'outbound_clicked',
  'category_opened',
  'ranking_opened',
] as const;

export type EventName = (typeof eventNames)[number];

export type EventProperties = Record<string, unknown>;

export type TrackEventInput = {
  eventName: EventName;
  occurredAt?: string;
  pagePath?: string;
  properties?: EventProperties;
};

export type TrackEvent = (event: TrackEventInput) => boolean;
