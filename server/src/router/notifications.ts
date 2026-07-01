import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../db/client.js';
import { subscriptions } from '../db/schema.js';
import { publicProcedure, router } from '../trpc.js';

const settingsSchema = z.object({
  enabled: z.boolean(),
  minMagnitude: z.number().min(2).max(8),
  updates: z.boolean(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
});

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export const DEFAULT_NOTIFICATION_SETTINGS = {
  subscribed: false,
  enabled: false,
  minMagnitude: 5,
  updates: false,
};

export const notificationsRouter = router({
  // Current settings for a browser (keyed by its push subscription endpoint).
  get: publicProcedure
    .input(z.object({ endpoint: z.string().min(1) }))
    .query(async ({ input }) => {
      const [row] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.endpoint, input.endpoint))
        .limit(1);
      if (!row) return DEFAULT_NOTIFICATION_SETTINGS;
      return {
        subscribed: true,
        enabled: row.enabled,
        minMagnitude: row.minMagnitude,
        updates: row.updates,
      };
    }),

  // Store (or refresh) a Web Push subscription together with its settings.
  subscribe: publicProcedure
    .input(
      z.object({
        subscription: subscriptionSchema,
        settings: settingsSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const { subscription, settings } = input;
      const now = new Date();
      await db
        .insert(subscriptions)
        .values({
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          enabled: settings.enabled,
          minMagnitude: settings.minMagnitude,
          updates: settings.updates,
          latitude: settings.latitude ?? null,
          longitude: settings.longitude ?? null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: subscriptions.endpoint,
          set: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            enabled: settings.enabled,
            minMagnitude: settings.minMagnitude,
            updates: settings.updates,
            latitude: settings.latitude ?? null,
            longitude: settings.longitude ?? null,
            updatedAt: now,
          },
        });
      return { ok: true };
    }),

  // Update just the settings for an existing subscription.
  saveSettings: publicProcedure
    .input(z.object({ endpoint: z.string().min(1) }).merge(settingsSchema))
    .mutation(async ({ input }) => {
      await db
        .update(subscriptions)
        .set({
          enabled: input.enabled,
          minMagnitude: input.minMagnitude,
          updates: input.updates,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.endpoint, input.endpoint));
      return { ok: true };
    }),

  unsubscribe: publicProcedure
    .input(z.object({ endpoint: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await db
        .delete(subscriptions)
        .where(eq(subscriptions.endpoint, input.endpoint));
      return { ok: true };
    }),
});
