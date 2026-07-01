# syntax=docker/dockerfile:1
# Builds and runs the QuakeTrack tRPC/Express API (the `server` workspace).
# The web workspace is a static site built separately by App Platform.
# Node 22: the EMSC notifier relies on the global `WebSocket` (stable since
# Node 21); Node 20 lacks it and crashes at startup.
FROM node:22-slim

WORKDIR /app

# Install workspace deps against the committed lockfile for reproducible builds.
# --include=dev so tsc/@types are present for the build (they're pruned below).
COPY package.json package-lock.json tsconfig.base.json ./
COPY server/package.json ./server/package.json
COPY web/package.json ./web/package.json
RUN npm ci --include=dev

# Build the server (tsc -> server/dist), then drop dev dependencies.
COPY server ./server
RUN npm run build --workspace server \
  && npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 8080
# App Platform injects PORT; the server reads process.env.PORT (defaults to 4000).
CMD ["node", "server/dist/index.js"]
