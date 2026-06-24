// Self-cleaning service worker.
// The earlier version cached the old app shell; this one removes all caches,
// unregisters itself, and reloads any open pages so the fresh app is served.
self.addEventListener('install', (e) => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const c of clients) {
      try { c.navigate(c.url); } catch (_) {}
    }
  })());
});

// Never serve from cache — always hit the network.
self.addEventListener('fetch', () => {});
