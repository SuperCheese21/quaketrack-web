import { and, eq, inArray, lte } from 'drizzle-orm';

import { db } from '../db/client.js';
import { notifiedEarthquakes, subscriptions } from '../db/schema.js';
import { formatTime } from '../lib/format.js';
import { describeLocation } from './geoserve.js';
import { sendPush, type QuakePushPayload } from './webpush.js';

/**
 * The minimal shape a notification needs, independent of the data source. Both
 * the USGS poller (`Earthquake`) and the EMSC websocket feed produce values that
 * satisfy this, so they can share the dedupe + push machinery below.
 */
export interface NotifiableQuake {
  /** Source-namespaced id (e.g. USGS `us7000...` or `emsc:20240101_0000001`). */
  id: string;
  mag: number;
  latitude: number;
  longitude: number;
  /** Epoch milliseconds of origin time. */
  time: number;
  /** Epoch milliseconds this revision was published; used to detect updates. */
  updated: number;
  /** A ready-made location string, if the source already has one. */
  place?: string | null;
  url?: string;
}

export type EventKind = 'new' | 'update';

/**
 * Decide whether an event is worth notifying about, given what we've already
 * seen. `null` means "nothing new" — same event, unchanged revision.
 */
export const classify = (
  quake: NotifiableQuake,
  seen: Map<string, number | null>,
): EventKind | null => {
  if (!seen.has(quake.id)) return 'new';
  const prevUpdated = seen.get(quake.id);
  if (prevUpdated !== null && prevUpdated !== quake.updated) return 'update';
  return null;
};

/** Record (or refresh) an event in the dedupe table so we don't re-alert. */
export const recordSeen = async (quake: NotifiableQuake): Promise<void> => {
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

/** Fan a single event out to every matching subscriber. */
export const notify = async (
  quake: NotifiableQuake,
  kind: EventKind,
): Promise<void> => {
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

  console.log(`[notifier] ${payload.title} -> ${recipients.length} subscriber(s)`);

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
    console.log(`[notifier] removed ${expiredEndpoints.length} expired subscription(s)`);
  }
};

/**
 * Process one freshly-received event end to end: look up what we've seen,
 * classify it, notify if warranted, and record it. Used by the EMSC websocket
 * feed, which arrives one event at a time (the poller batches instead).
 */
export const handleEvent = async (quake: NotifiableQuake): Promise<void> => {
  const existing = await db
    .select({ updatedTime: notifiedEarthquakes.updatedTime })
    .from(notifiedEarthquakes)
    .where(eq(notifiedEarthquakes.earthquakeId, quake.id));

  const seen = new Map<string, number | null>(
    existing.map((row) => [quake.id, row.updatedTime]),
  );

  const kind = classify(quake, seen);
  if (kind === null) return;

  await notify(quake, kind);
  await recordSeen(quake);
};
