// Service worker: makes the trainer installable and lets the pages that need no server logic
// (tutorial text, algorithm list, pair words, the app itself) open offline.
// Pages are fetched fresh when online, so a new deploy shows up at once; the hashed files in
// /assets/ never change, so they are kept for good. Cube solving stays online: the solver is on the server.
const CACHE = 'bld-v1';
const OFFLINE_API = ['/api/algs', '/api/pairs'];      // read-only data worth keeping

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add('/')).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

const keep = response => response.ok && !response.redirected || response.type === 'opaque';

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (keep(response)) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (keep(response)) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const hit = await cache.match(request) || (fallbackUrl && await cache.match(fallbackUrl));
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) {
    // the web fonts
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') event.respondWith(cacheFirst(request));
    return;
  }
  if (url.pathname.startsWith('/assets/')) event.respondWith(cacheFirst(request));
  else if (request.mode === 'navigate') event.respondWith(networkFirst(request, '/'));
  else if (OFFLINE_API.includes(url.pathname)) event.respondWith(networkFirst(request));
});
