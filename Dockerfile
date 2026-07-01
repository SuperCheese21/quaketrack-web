# syntax=docker/dockerfile:1
# Builds and runs the QuakeTrack tRPC/Express API (the `server` workspace).
# The web workspace is a static site built separately by App Platform.
FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production

# Install workspace deps against the committed lockfile for reproducible builds.
# (npm ci installs the whole lockfile; web deps are pruned out below.)
COPY package.json package-lock.json tsconfig.base.json ./
COPY server/package.json ./server/package.json
COPY web/package.json ./web/package.json
RUN npm ci

# Build the server (tsc -> server/dist), then drop dev dependencies.
COPY server ./server
RUN npm run build --workspace server \
  && npm prune --omit=dev

EXPOSE 8080
# App Platform injects PORT; the server reads process.env.PORT (defaults to 4000).
CMD ["node", "server/dist/index.js"]
