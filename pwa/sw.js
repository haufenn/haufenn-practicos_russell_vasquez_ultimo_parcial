const CACHE_NAME = 'licores-cache-v1';
const urlsToCache = [
  '/',
  '/login.html',
  '/dashboard.html',
  '/inventario.html',
  '/movimientos.html',
  '/catalogo.html',
  '/reportes.html',
  '/css/styles.css',
  '/js/script.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  const method = event.request.method;
  
  // Solo manejar GET
  if (method !== 'GET') {
    return;
  }
  
  // No cachear la API
  if (url.includes('/productos') || url.includes('/login') || url.includes('/movimientos')) {
    return;
  }
  
  // No cachear extensiones de Chrome
  if (!url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(() => {
      return caches.match('/');
    })
  );
});
// Sincronización en segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'sync-productos') {
    event.waitUntil(sincronizarProductos());
  }
});

function sincronizarProductos() {
  return clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_PRODUCTOS' });
    });
  });
}
