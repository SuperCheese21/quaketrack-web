import { router } from '../trpc.js';
import { configRouter } from './config.js';
import { earthquakesRouter } from './earthquakes.js';
import { notificationsRouter } from './notifications.js';

export const appRouter = router({
  earthquakes: earthquakesRouter,
  notifications: notificationsRouter,
  config: configRouter,
});

// Consumed as a type-only import by the web client for end-to-end type safety.
export type AppRouter = typeof appRouter;
