const CACHE_NAME = 'silog-v2';

// Only cache static assets — never the app HTML or JS chunks
const STATIC_ASSETS = [
  '/offline.html',
  '/logo-192.png',
  '/logo-180.png',
  '/logo-512.png',
];

// Install — cache only static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — remove all old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((name) => name !== CACHE_NAME && caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never intercept API calls or Supabase — must always go to network
  if (url.pathname.startsWith('/api/')) return;
  if (url.hostname.includes('supabase.co')) return;

  // Navigation requests (page loads): network-first
  // Try network → on failure serve offline.html
  // This prevents stale cached HTML from ever causing an infinite spinner
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Static assets (images, fonts, icons): cache-first
  // These never change so serving from cache is safe and fast
  if (
    url.pathname.startsWith('/_next/static/') ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network only
  // (don't cache dynamic content — keeps the app always fresh)
});
