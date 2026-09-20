const CACHE_NAME = 'justcalendar-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/icon.svg', '/config.json'])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      return caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy).then(() => response));
    }
    return response;
  }).catch(() => caches.match(event.request).then(async (cached) => {
    if (cached) return cached;
    if (event.request.mode === 'navigate') return caches.match('/') ?? new Response('Offline', { status: 503 });
    return new Response('Offline', { status: 503 });
  })));
});
