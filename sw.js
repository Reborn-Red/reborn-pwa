// REBORN PWA Service Worker - v3
const CACHE_NAME = 'reborn-cache-v3';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-512.png',                    // ← use relative paths if possible
  '/icons/icon-1024.png',
  // Add more critical files if you have them (CSS, JS bundles, etc.)
  // e.g. '/css/main.css', '/js/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Network-first strategy for everything
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses (except non-200 or opaque)
        if (response && response.status === 200 && response.type !== 'opaque') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then(cached => {
          return cached || new Response('Offline - content not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
