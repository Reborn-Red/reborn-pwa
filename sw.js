// REBORN PWA Service Worker - v3
// Network-first + cache fallback + cleanup old caches

const CACHE_NAME = 'reborn-cache-v3';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-512.png',
  '/icons/icon-1024.png',
  '/icons/icon-192.png',
  '/icons/icon-192-maskable.png'
  // Add more critical static files here if you have them (CSS, JS, fonts…)
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
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200 && response.type !== 'opaque') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed → try cache
        return caches.match(event.request).then(cached => {
          return cached || new Response(
            '<h1>Offline</h1><p>REBORN content not available right now.<br>Please check your connection.</p>',
            {
              headers: { 'Content-Type': 'text/html' }
            }
          );
        });
      })
  );
});
