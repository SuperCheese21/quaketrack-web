import 'dotenv/config';

import { db } from '../db/client.js';
import { subscriptions } from '../db/schema.js';
import { sendPush } from '../services/webpush.js';

/**
 * Sends a sample push notification to every stored subscription. Use it to
 * verify the end-to-end Web Push flow (browser permission -> service worker ->
 * notification) without waiting for a real earthquake.
 *
 *   npm run test:push --workspace server
 */
const run = async (): Promise<void> => {
  const subs = await db.select().from(subscriptions);
  if (subs.length === 0) {
    console.log(
      'No subscriptions stored yet. Enable notifications in the web app first.',
    );
    process.exit(0);
  }

  const payload = {
    title: 'TEST: M 9.9 - QuakeTrack test alert',
    body: 'This is a test notification (NOT A REAL EARTHQUAKE)',
    earthquakeId: 'test',
    mag: 9.9,
  };

  for (const sub of subs) {
    const result = await sendPush(sub, payload);
    console.log(`${sub.endpoint.slice(0, 48)}... ->`, result);
  }
  process.exit(0);
};

void run();
