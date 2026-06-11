const CACHE_NAME = 'atl-flotte-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// ─── Install : mettre en cache les ressources statiques ───────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate : supprimer les anciens caches ───────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch : stratégie intelligente ────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Ne traiter que les requêtes GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Pour les requêtes de navigation (charger une page de l'app) → Network-First avec fallback Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Les appels API Django sont gérés par IndexedDB dans React (pas le SW)
  // → passage en réseau direct pour ne pas interférer avec la logique offline
  if (url.pathname.includes('/api/') || url.hostname.includes('onrender.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Retourner une réponse vide signalant l'absence de réseau
        return new Response(JSON.stringify({ _offline: true, error: 'network_unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Pour tous les autres assets (JS, CSS, fonts, images) → Cache-First
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});
