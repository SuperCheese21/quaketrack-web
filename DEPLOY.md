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
- A **managed** Postgres cluster. App Platform *dev* databases bind a non-owner
  user with no CREATE on the database or `public` schema (Postgres 15+ lockdown),
  so the app can't create its tables — a managed cluster (app binds `doadmin`) is
  required. App Platform attaches an *existing* cluster by name, so create it first:

  ```sh
  doctl databases create quaketrack-db --engine pg --version 16 \
    --size db-s-1vcpu-1gb --num-nodes 1 --region nyc3
  ```

  The `databases` block in [`.do/app.yaml`](.do/app.yaml) references it by
  `cluster_name`. Move it into your project with
  `doctl projects resources assign <project-id> --resource=do:dbaas:<db-id>`, and
  restrict access to the app with
  `doctl databases firewalls append <db-id> --rule app:<app-id>`.

## First deploy

1. Set the GitHub `repo: OWNER/quaketrack-web` in [`.do/app.yaml`](.do/app.yaml).
2. Create the app in your project (attaches the managed cluster above):

   ```sh
   doctl apps create --spec .do/app.yaml --project-id <project-id>
   ```

3. Set the VAPID secrets. ⚠️ `type: SECRET` envs in the committed spec have **no
   value**, and applying that spec with `doctl apps update` **clears** any
   existing secret. So inject the values whenever you apply the spec (a temp copy
   with `value:` lines added), or set them once in the console under the `api`
   component → Environment Variables (encrypted) and avoid re-applying the spec
   with `doctl`. Git-push deploys (`deploy_on_push`) reuse the stored spec and
   preserve secrets — it's only `doctl apps update --spec` that wipes them.

4. The database schema is applied automatically: the server runs migrations on
   boot (see `server/src/db/migrate.ts`) from the committed SQL in
   `server/drizzle/`, tracked in a `public._migrations` table. (We use a small
   custom runner rather than Drizzle's migrator because the latter creates a
   `drizzle` schema, which needs CREATE-on-database privileges.) After changing
   `schema.ts`, regenerate and commit:

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
