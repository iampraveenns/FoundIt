// FoundIt PWA Service Worker for offline app shell and API caching
declare const self: any;

const CACHE_NAME = 'foundit-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline shell');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Cache addAll skipped non-critical file:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event: any) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass WebSocket / Socket.io
  if (url.pathname.startsWith('/socket.io') || request.headers.get('upgrade') === 'websocket') {
    return;
  }

  // Network-first with cache fallback for API items list
  if (url.pathname.startsWith('/api/items') && request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          console.log('[ServiceWorker] Serving items from offline cache');
          return caches.match(request).then((cached) => {
            return (
              cached ||
              new Response(
                JSON.stringify({
                  success: true,
                  items: [],
                  offline: true,
                  message: 'You are currently offline. Displaying cached data.',
                }),
                { headers: { 'Content-Type': 'application/json' } }
              )
            );
          });
        })
    );
    return;
  }

  // Standard Stale-While-Revalidate for app shell
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
