// REBORN PWA Service Worker - v3 (minimal for TWA + basic offline)
const CACHE_NAME = 'reborn-cache-v3';

const STATIC_ASSETS = [
  '/',                  // homepage
  '/manifest.json',     // required for installability
  // Add any critical CSS/JS if your Squarespace site has offline-critical files
  // e.g. '/assets/css/main.css', '/assets/js/site.js'
  // Do NOT add icon URLs here — native ones are in APK
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request)
        .then(cached => cached || new Response(
          '<h1>Offline</h1><p>REBORN content not available right now.<br>Please check your connection.</p>',
          { headers: { 'Content-Type': 'text/html' } }
        ))
      )
  );
});
