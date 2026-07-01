import {
  bigint,
  boolean,
  doublePrecision,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/**
 * One row per browser Web Push subscription. The subscription `endpoint` is the
 * anonymous user identity — the web analog of the Expo push token the RN app
 * keyed its Firebase records on. Notification settings live on the same row,
 * mirroring the mobile app's { notifications, minMagnitude, updates } model.
 */
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  minMagnitude: doublePrecision('min_magnitude').notNull().default(5),
  updates: boolean('updates').notNull().default(false),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Dedupe table so the poller never alerts twice for the same event. `sentUpdate`
 * records whether we've already pushed an "UPDATE" for a revised event.
 */
export const notifiedEarthquakes = pgTable('notified_earthquakes', {
  earthquakeId: text('earthquake_id').primaryKey(),
  mag: doublePrecision('mag').notNull(),
  // USGS `updated` is an epoch-millisecond value that exceeds int4 range.
  updatedTime: bigint('updated_time', { mode: 'number' }),
  notifiedAt: timestamp('notified_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
