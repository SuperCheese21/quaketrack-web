import 'dotenv/config';

import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';
import express from 'express';

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
app.listen(port, () => {
  console.log(`[server] tRPC API listening on http://localhost:${port}/trpc`);
  startPoller();
});
