import { and, eq, inArray, lte } from 'drizzle-orm';

import { db } from '../db/client.js';
import { notifiedEarthquakes, subscriptions } from '../db/schema.js';
import { formatTime } from '../lib/format.js';
import { describeLocation } from './geoserve.js';
import { fetchEarthquakes, type Earthquake } from './usgs.js';
import { isConfigured, sendPush, type QuakePushPayload } from './webpush.js';

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 60_000);
const POLL_MIN_MAGNITUDE = Number(process.env.POLL_MIN_MAGNITUDE ?? 2);
const POLL_LIMIT = 200;

type EventKind = 'new' | 'update';

const classify = (
  quake: Earthquake,
  seen: Map<string, number | null>,
): EventKind | null => {
  if (!seen.has(quake.id)) return 'new';
  const prevUpdated = seen.get(quake.id);
  if (prevUpdated !== null && prevUpdated !== quake.updated) return 'update';
  return null;
};

const recordSeen = async (quake: Earthquake): Promise<void> => {
  await db
    .insert(notifiedEarthquakes)
    .values({
      earthquakeId: quake.id,
      mag: quake.mag,
      updatedTime: quake.updated,
      notifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: notifiedEarthquakes.earthquakeId,
      set: { mag: quake.mag, updatedTime: quake.updated, notifiedAt: new Date() },
    });
};

const notify = async (quake: Earthquake, kind: EventKind): Promise<void> => {
  // Mirror the RN push server's rule: mag >= minMagnitude && (isNew || updates)
  const conditions = [
    eq(subscriptions.enabled, true),
    lte(subscriptions.minMagnitude, quake.mag),
  ];
  if (kind === 'update') conditions.push(eq(subscriptions.updates, true));

  const recipients = await db
    .select()
    .from(subscriptions)
    .where(and(...conditions));

  if (recipients.length === 0) return;

  const location = await describeLocation({
    lat: quake.latitude,
    lon: quake.longitude,
    mag: quake.mag,
    fallbackPlace: quake.place,
  });
  const payload: QuakePushPayload = {
    title: `${kind === 'update' ? 'UPDATE: ' : ''}M ${quake.mag.toFixed(1)} - ${location}`,
    body: formatTime(quake.time),
    earthquakeId: quake.id,
    mag: quake.mag,
    url: quake.url,
  };

  console.log(
    `[poller] ${payload.title} -> ${recipients.length} subscriber(s)`,
  );

  const results = await Promise.allSettled(
    recipients.map((sub) => sendPush(sub, payload)),
  );

  const expiredEndpoints: string[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.expired) {
      expiredEndpoints.push(recipients[i].endpoint);
    }
  });

  if (expiredEndpoints.length > 0) {
    await db
      .delete(subscriptions)
      .where(inArray(subscriptions.endpoint, expiredEndpoints));
    console.log(`[poller] removed ${expiredEndpoints.length} expired subscription(s)`);
  }
};

let polling = false;

const pollOnce = async (seedOnly = false): Promise<void> => {
  if (polling) return;
  polling = true;
  try {
    const { earthquakes } = await fetchEarthquakes({
      minMagnitude: POLL_MIN_MAGNITUDE,
      limit: POLL_LIMIT,
      dateEnabled: false,
      orderBy: 'time',
    });
    if (earthquakes.length === 0) return;

    const ids = earthquakes.map((q) => q.id);
    const existing = await db
      .select({
        id: notifiedEarthquakes.earthquakeId,
        updatedTime: notifiedEarthquakes.updatedTime,
      })
      .from(notifiedEarthquakes)
      .where(inArray(notifiedEarthquakes.earthquakeId, ids));
    const seen = new Map(existing.map((row) => [row.id, row.updatedTime]));

    for (const quake of earthquakes) {
      const kind = classify(quake, seen);
      if (kind === null) continue;
      if (!seedOnly) {
        await notify(quake, kind);
      }
      await recordSeen(quake);
    }
  } catch (err) {
    console.error('[poller] poll failed:', err);
  } finally {
    polling = false;
  }
};

export const startPoller = (): void => {
  if (!isConfigured()) {
    console.warn(
      '[poller] VAPID keys not set — background push disabled. Run `npm run gen-vapid` and fill server/.env to enable alerts.',
    );
    return;
  }
  console.log(
    `[poller] starting: every ${POLL_INTERVAL_MS}ms, min magnitude ${POLL_MIN_MAGNITUDE}`,
  );
  // Seed the current window as "already seen" so we only alert on genuinely
  // new/updated events after startup (no alert storm on first boot).
  void pollOnce(true).then(() => {
    setInterval(() => void pollOnce(false), POLL_INTERVAL_MS);
  });
};
