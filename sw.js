// REBORN PWA Service Worker
// Caches key assets for faster loading and basic offline support

const CACHE_NAME = 'reborn-cache-v1';

const ASSETS_TO_CACHE = [
  'https://reborn.red/',
  'https://static1.squarespace.com/static/5c868012348cd967825e0d25/t/699f27c9c07c504c24bdadc6/1772038089228/Reborn-Icon-512.png',
  'https://static1.squarespace.com/static/5c868012348cd967825e0d25/t/699f27c474ad1a18950301ea/1772038084292/Reborn-Icon-1024.png'
];

// Install — cache key assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
// Always tries live network first so content stays fresh
// Falls back to cache only if network fails
self.addEventListener('fetch', function(event) {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Cache a copy of successful responses
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Network failed — serve from cache
        return caches.match(event.request);
      })
  );
});
