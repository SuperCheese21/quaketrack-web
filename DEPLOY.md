# Deploying QuakeTrack to DigitalOcean App Platform

QuakeTrack runs as a single App Platform app with three components that share a
domain (see [`.do/app.yaml`](.do/app.yaml)):

| Component | Type        | Source            | Route    |
| --------- | ----------- | ----------------- | -------- |
| `api`     | service     | `Dockerfile`      | `/trpc`  |
| `web`     | static_site | Vite build        | `/`      |
| `db`      | database    | Managed Postgres  | —        |

The SPA calls `/trpc` as a **relative** URL, so ingress routing (`/trpc` → api,
everything else → web) keeps the API same-origin — no CORS, no hardcoded API host.

## Prerequisites

- `doctl` authenticated (`doctl auth init`).
- The GitHub repo pushed, and the DigitalOcean ↔ GitHub integration authorized
  once via the console: **Apps → Create → GitHub → Authorize** (App Platform
  cannot pull from a repo it hasn't been granted access to).
- VAPID keys: `npm run gen-vapid --workspace server`.

## First deploy

1. Set the GitHub `repo: OWNER/quaketrack-web` in [`.do/app.yaml`](.do/app.yaml).
2. Create the app (provisions the managed Postgres too):

   ```sh
   doctl apps create --spec .do/app.yaml
   ```

3. Set the VAPID secrets (kept out of the spec/git):

   ```sh
   APP_ID=$(doctl apps list --format ID,Spec.Name --no-header | awk '/quaketrack/{print $1}')
   doctl apps update "$APP_ID" --spec .do/app.yaml \
     --update-env "api:VAPID_PUBLIC_KEY=...,VAPID_PRIVATE_KEY=..."
   ```

   (Or set them in the console under the `api` component → Environment Variables,
   marked as encrypted.)

4. The database schema is applied automatically. App Platform dev databases are
   only reachable from inside the app, so the server runs Drizzle migrations on
   boot (see `server/src/db/migrate.ts`) using the committed SQL in
   `server/drizzle/`. After changing `schema.ts`, regenerate and commit:

   ```sh
   npm run db:generate --workspace server   # writes server/drizzle/*.sql
   git add server/drizzle && git commit -m "db: <change>" && git push
   ```

   The next deploy applies them. (Locally, `npm run db:push --workspace server`
   against a reachable Postgres still works for quick iteration.)

## Ongoing deploys

`deploy_on_push: true` is set, so pushing to `main` triggers a rebuild. To apply
spec changes: `doctl apps update <APP_ID> --spec .do/app.yaml`.

## Environment variables

| Var                  | Where            | Notes                                    |
| -------------------- | ---------------- | ---------------------------------------- |
| `DATABASE_URL`       | bound `${db.*}`  | Managed Postgres, TLS required           |
| `VAPID_PUBLIC_KEY`   | secret           | `npm run gen-vapid`                       |
| `VAPID_PRIVATE_KEY`  | secret           | `npm run gen-vapid`                       |
| `VAPID_SUBJECT`      | spec             | `mailto:` contact URI                     |
| `POLL_INTERVAL_MS`   | spec             | USGS poll cadence (default 60000)         |
| `POLL_MIN_MAGNITUDE` | spec             | Poller magnitude floor (default 2)        |
| `PORT`               | injected         | App Platform sets it; server honors it    |
