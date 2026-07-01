# QuakeTrack Web

A fully-functioning web port of the **QuakeTrack** React Native earthquake tracker + alerting app.

Real-time earthquake data from the [USGS FDSNWS API](https://earthquake.usgs.gov/fdsnws/event/1/),
an interactive map with tectonic-plate overlays, magnitude-colored lists, detail views with
ShakeMap contours, and **background push alerts** (Web Push) when a new quake exceeds your
magnitude threshold — even when the tab is closed. Responsive and installable as a PWA on mobile.

## Stack

- **TypeScript** everywhere
- **Node + Express + tRPC** backend (`server/`)
- **Drizzle ORM + SQLite** (`better-sqlite3`) for push subscriptions & notification settings
- **web-push** (VAPID) for background notifications, driven by the EMSC/SeismicPortal real-time websocket (with a USGS poller fallback)
- **React + Vite** frontend (`web/`)
- **TailwindCSS + DaisyUI + stratosphere-ui** for the UI
- **React-Leaflet + OpenStreetMap** for maps
- **@tanstack/react-query** via the tRPC React client

## Getting started

```bash
npm install                 # install all workspaces
npm run gen-vapid           # generate VAPID keys -> prints values for server/.env
cp server/.env.example server/.env   # then paste the VAPID keys in
npm run db:push             # create the SQLite schema
npm run dev                 # start server (:4000) + web (:5173) together
```

Open http://localhost:5173. The Vite dev server proxies `/trpc` to the backend.

## Layout

```
server/   Node + tRPC + Drizzle + web-push + EMSC websocket / USGS poller
web/      Vite + React + Tailwind/DaisyUI + stratosphere-ui + Leaflet
```

See [`server/README`](server) routers in `server/src/router` and the notification
sources in `server/src/services/emsc.ts` (real-time websocket) and
`server/src/services/poller.ts` (USGS fallback), which share
`server/src/services/notifier.ts`. The frontend screens live in `web/src/pages` and reusable
UI in `web/src/components`.
