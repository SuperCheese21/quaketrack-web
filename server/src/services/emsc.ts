import { EMSC_EVENT_URL, EMSC_WEBSOCKET_URL } from '../lib/constants.js';
import { handleEvent, type NotifiableQuake } from './notifier.js';
import { isConfigured } from './webpush.js';

// Share the poller's magnitude floor so both notification sources behave alike.
const MIN_MAGNITUDE = Number(process.env.POLL_MIN_MAGNITUDE ?? 2);

// Reconnect backoff: start fast, back off to a ceiling so a prolonged outage
// doesn't hammer the endpoint. Ported in spirit from the RN server's fixed 2s.
const RECONNECT_MIN_MS = 2_000;
const RECONNECT_MAX_MS = 60_000;

/** Shape of a SeismicPortal real-time message. */
interface EmscMessage {
  action?: string;
  data?: {
    properties?: {
      unid?: string;
      lat?: number;
      lon?: number;
      mag?: number;
      time?: string;
      lastupdate?: string;
      flynn_region?: string;
    };
  };
}

const parseEpoch = (value: string | undefined): number | null => {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
};

/**
 * Turn a raw websocket message into a `NotifiableQuake`, or `null` if it should
 * be ignored (malformed, or below the magnitude floor).
 */
const toQuake = (raw: string): NotifiableQuake | null => {
  let message: EmscMessage;
  try {
    message = JSON.parse(raw) as EmscMessage;
  } catch {
    console.error('[emsc] failed to parse message');
    return null;
  }

  const props = message.data?.properties;
  if (!props?.unid || typeof props.mag !== 'number') return null;
  if (typeof props.lat !== 'number' || typeof props.lon !== 'number') return null;
  if (props.mag < MIN_MAGNITUDE) return null;

  const time = parseEpoch(props.time);
  if (time === null) return null;

  return {
    // Namespace the id so EMSC events never collide with USGS ids in the
    // dedupe table.
    id: `emsc:${props.unid}`,
    mag: props.mag,
    latitude: props.lat,
    longitude: props.lon,
    time,
    updated: parseEpoch(props.lastupdate) ?? time,
    place: props.flynn_region ?? null,
    url: EMSC_EVENT_URL(props.unid),
  };
};

let reconnectDelay = RECONNECT_MIN_MS;
let stopped = false;

const connect = (): void => {
  if (stopped) return;
  const ws = new WebSocket(EMSC_WEBSOCKET_URL);

  ws.onopen = () => {
    reconnectDelay = RECONNECT_MIN_MS;
    console.log(`[emsc] connected to ${EMSC_WEBSOCKET_URL}`);
  };

  ws.onmessage = (event: MessageEvent) => {
    if (typeof event.data !== 'string') return;
    const quake = toQuake(event.data);
    if (quake === null) return;
    void handleEvent(quake).catch((err) =>
      console.error('[emsc] failed to handle event:', err),
    );
  };

  ws.onerror = () => {
    // `onclose` fires right after and owns the reconnect; just note it.
    console.warn('[emsc] websocket error');
  };

  ws.onclose = () => {
    if (stopped) return;
    console.warn(`[emsc] disconnected — reconnecting in ${reconnectDelay}ms`);
    setTimeout(connect, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
  };
};

/**
 * Start the EMSC real-time websocket notifier. Delivers pushes within seconds
 * of an event, replacing the minute-granularity USGS poll. No-op (with a
 * warning) if VAPID keys aren't configured, matching `startPoller`.
 */
export const startEmscFeed = (): void => {
  if (!isConfigured()) {
    console.warn(
      '[emsc] VAPID keys not set — background push disabled. Run `npm run gen-vapid` and fill server/.env to enable alerts.',
    );
    return;
  }
  console.log(
    `[emsc] starting real-time feed, min magnitude ${MIN_MAGNITUDE}`,
  );
  stopped = false;
  connect();
};
