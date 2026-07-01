// USGS FDSNWS + Geoserve endpoints (ported from the RN app + push server)
export const USGS_DOMAIN = 'https://earthquake.usgs.gov';
export const USGS_QUERY_URL = `${USGS_DOMAIN}/fdsnws/event/1/query`;
export const USGS_GEOSERVE_PLACES = `${USGS_DOMAIN}/ws/geoserve/places.json`;
export const USGS_GEOSERVE_REGIONS = `${USGS_DOMAIN}/ws/geoserve/regions.json`;

// EMSC / SeismicPortal real-time websocket feed. Pushes events within seconds
// of detection, far faster than polling USGS. See:
// https://www.seismicportal.eu/realtime.html
export const EMSC_WEBSOCKET_URL =
  'wss://www.seismicportal.eu/standing_order/websocket';
// Per-event page on the SeismicPortal, keyed by the EMSC `unid`.
export const EMSC_EVENT_URL = (unid: string): string =>
  `https://www.seismicportal.eu/eventdetails.html?unid=${unid}`;

export const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss UTC';

// 16-point compass, used to turn a bearing into a cardinal direction
export const CARDINAL_DIRECTIONS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
] as const;
export const NUM_DEGREES = 360;
export const ARC_LENGTH = NUM_DEGREES / CARDINAL_DIRECTIONS.length;

// Countries where we show the state/admin abbreviation instead of the country name
export const COUNTRIES_TO_DISPLAY_STATES = ['United States', 'Canada'];

// Allowed values coming from the client Filters form
export const LIMIT_OPTIONS = [10, 50, 100, 500, 1000] as const;
export const ORDER_BY_OPTIONS = [
  'time',
  'time-asc',
  'magnitude',
  'magnitude-asc',
] as const;
export type OrderBy = (typeof ORDER_BY_OPTIONS)[number];
