import 'dotenv/config';

import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';
import express from 'express';

import { runMigrations } from './db/migrate.js';
import { appRouter } from './router/index.js';
import { startEmscFeed } from './services/emsc.js';
import { startPoller } from './services/poller.js';

// Which source drives background push notifications. `emsc` (default) uses the
// real-time SeismicPortal websocket for near-instant alerts; `usgs` falls back
// to the minute-granularity USGS poller. They must not both run, or the same
// physical earthquake would notify twice (each source has its own event ids).
const NOTIFICATION_SOURCE = process.env.NOTIFICATION_SOURCE ?? 'emsc';

const startNotifications = (): void => {
  if (NOTIFICATION_SOURCE === 'usgs') {
    startPoller();
  } else {
    startEmscFeed();
  }
};

const app = express();

app.use(cors());
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
  }),
);

const port = Number(process.env.PORT ?? 4000);

const start = async (): Promise<void> => {
  await runMigrations();
  app.listen(port, () => {
    console.log(`[server] tRPC API listening on http://localhost:${port}/trpc`);
    startNotifications();
  });
};

start().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
