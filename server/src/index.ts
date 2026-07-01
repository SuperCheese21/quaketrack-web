import 'dotenv/config';

import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';
import express from 'express';

import { runMigrations } from './db/migrate.js';
import { appRouter } from './router/index.js';
import { startPoller } from './services/poller.js';

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
    startPoller();
  });
};

start().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
