self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('pastel-pop-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/src/main.js',
        '/src/game.js',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png'
        // Add more if needed (e.g. sounds, CSS, other JS)
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
