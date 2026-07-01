/* QuakeTrack service worker: Web Push + a lightweight offline shell. */
const CACHE = 'quaketrack-v1';
const APP_SHELL = ['/', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // skip map tiles, etc.
  if (url.pathname.startsWith('/trpc')) return; // never cache the API

  // Network-first for navigations, falling back to the cached shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then((r) => r || Response.error()),
      ),
    );
    return;
  }

  // Cache-first for built assets + icons only (leaves Vite dev modules alone).
  const isCacheable =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icon') ||
    url.pathname === '/manifest.webmanifest';
  if (!isCacheable) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        }),
    ),
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { title: 'QuakeTrack', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'QuakeTrack';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.earthquakeId || 'quaketrack',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { earthquakeId: data.earthquakeId, url: data.url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const id = event.notification.data && event.notification.data.earthquakeId;
  const target = id && id !== 'test' ? `/quake/${encodeURIComponent(id)}` : '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ('focus' in client) {
            if ('navigate' in client) client.navigate(target);
            return client.focus();
          }
        }
        return self.clients.openWindow(target);
      }),
  );
});
