import { getVapidPublicKey } from '../services/webpush.js';
import { publicProcedure, router } from '../trpc.js';

export const configRouter = router({
  // The client needs the VAPID public key to create a push subscription.
  vapidPublicKey: publicProcedure.query(() => ({
    publicKey: getVapidPublicKey(),
  })),
});
