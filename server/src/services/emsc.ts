import { EMSC_EVENT_URL, EMSC_WEBSOCKET_URL } from '../lib/constants.js';
import { handleEvent, type NotifiableQuake } from './notifier.js';
import { isConfigured } from './webpush.js';

// Share the poller's magnitude floor so both notification sources behave alike.
const MIN_MAGNITUDE = Number(process.env.POLL_MIN_MAGNITUDE ?? 2);

// Reconnect backoff: start fast, back off to a ceiling so a prolonged outage
// doesn't hammer the endpoint. Ported in spirit from the RN server's fixed 2s.
const RECONNECT_MIN_MS = 2_000;
const RECONNECT_MAX_MS = 60_000;

// If a socket doesn't reach OPEN within this window, treat the connect as
// failed and retry. Guards against `new WebSocket()` hanging forever when the
// TCP connect stalls without ever firing onopen/onerror/onclose.
const CONNECT_TIMEOUT_MS = 15_000;

// Proactively recycle a healthy connection at this age. The global (undici)
// WebSocket exposes no ping/pong, and the feed is silent between events, so we
// have no way to notice a silently half-open TCP link (NAT / load-balancer idle
// timeout, network blip) — no close frame ever arrives. A periodic recycle is
// our only liveness guarantee: worst case the feed self-heals within this age.
const CONNECTION_MAX_AGE_MS = 30 * 60_000;

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
let socket: WebSocket | null = null;
let connectTimer: ReturnType<typeof setTimeout> | null = null;
let ageTimer: ReturnType<typeof setTimeout> | null = null;

const clearTimers = (): void => {
  if (connectTimer !== null) {
    clearTimeout(connectTimer);
    connectTimer = null;
  }
  if (ageTimer !== null) {
    clearTimeout(ageTimer);
    ageTimer = null;
  }
};

const scheduleReconnect = (delay: number): void => {
  if (stopped) return;
  console.warn(`[emsc] reconnecting in ${delay}ms`);
  setTimeout(connect, delay);
  // Grow the backoff for the *next* failure; onopen resets it to the floor.
  reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
};

/**
 * Tear down the active socket and schedule a reconnect. Idempotent for a given
 * connection: the first caller (connect timeout, onclose, or age recycle) wins
 * and the rest short-circuit, so a dead socket can never fan out into multiple
 * overlapping reconnects. `immediate` skips the backoff for proactive recycles
 * of a *healthy* connection, minimizing the window where an event could slip by.
 */
const teardown = (reason: string, immediate = false): void => {
  if (socket === null) return;
  const dead = socket;
  socket = null;
  clearTimers();
  // Detach handlers first so the forced close can't re-enter teardown.
  dead.onopen = dead.onmessage = dead.onerror = dead.onclose = null;
  try {
    dead.close();
  } catch {
    // Already closing/closed — nothing to do.
  }
  console.warn(`[emsc] connection lost (${reason})`);
  scheduleReconnect(immediate ? 0 : reconnectDelay);
};

const connect = (): void => {
  if (stopped) return;
  const ws = new WebSocket(EMSC_WEBSOCKET_URL);
  socket = ws;

  // Bound the connect: if OPEN isn't reached in time, retry rather than hang.
  connectTimer = setTimeout(() => {
    if (socket === ws) teardown('connect timeout');
  }, CONNECT_TIMEOUT_MS);

  ws.onopen = () => {
    if (socket !== ws) return; // superseded by a newer connection
    reconnectDelay = RECONNECT_MIN_MS;
    if (connectTimer !== null) {
      clearTimeout(connectTimer);
      connectTimer = null;
    }
    // Arm the liveness recycle for this connection.
    ageTimer = setTimeout(() => {
      if (socket === ws) teardown('max connection age', true);
    }, CONNECTION_MAX_AGE_MS);
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
    if (socket !== ws) return; // already torn down by a watchdog
    teardown('closed by server');
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
