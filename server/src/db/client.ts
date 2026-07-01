import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Point it at a Postgres instance, e.g. ' +
      'postgres://user:pass@host:5432/quaketrack?sslmode=require',
  );
}

// DigitalOcean Managed Postgres (and most hosted providers) require TLS. Local
// dev against a plain Postgres can opt out with DATABASE_SSL=false.
const isLocal = /@(localhost|127\.0\.0\.1)\b/.test(connectionString);
const useSsl = process.env.DATABASE_SSL !== 'false' && !isLocal;

// Keep the pool small — DigitalOcean dev databases have a low connection cap,
// and this single process (API + background poller) is the only consumer.
const poolMax = Number(process.env.DB_POOL_MAX ?? 5);

const client = postgres(connectionString, {
  max: poolMax,
  ssl: useSsl ? 'require' : false,
});

export const db = drizzle(client, { schema });
export { schema };
