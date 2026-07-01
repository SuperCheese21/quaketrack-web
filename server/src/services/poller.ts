import { inArray } from 'drizzle-orm';

import { db } from '../db/client.js';
import { notifiedEarthquakes } from '../db/schema.js';
import { classify, notify, recordSeen } from './notifier.js';
import { fetchEarthquakes } from './usgs.js';
import { isConfigured } from './webpush.js';

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 60_000);
const POLL_MIN_MAGNITUDE = Number(process.env.POLL_MIN_MAGNITUDE ?? 2);
const POLL_LIMIT = 200;

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
