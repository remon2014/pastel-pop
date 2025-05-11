// sw.js

const CACHE_NAME = 'pastel-pop-v2'; // 🔁 Update this on changes
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/game.js',
  '/src/leaderboard.js',
  '/src/uiManager.js',
  '/manifest.json',
  '/favicon.ico',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;500&display=swap',
  // Add any additional static assets your game uses
];

// ✅ Install: cache necessary files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Caching assets');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// ✅ Activate: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// ✅ Fetch: serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Always go to network for navigation (like reloading the page)
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
    return;
  }

  // For other requests, try cache first
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
