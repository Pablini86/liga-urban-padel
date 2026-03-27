const CACHE = 'urban-padel-v2';
const ASSETS = ['/favicon.png', '/logo.png', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // index.html y SW siempre de red (nunca cacheado)
  if(e.request.url.endsWith('/') || 
     e.request.url.endsWith('/index.html') ||
     e.request.url.endsWith('/sw.js')) {
    return e.respondWith(fetch(e.request));
  }
  // Firebase y externos siempre de red
  if(e.request.url.includes('firestore') || 
     e.request.url.includes('firebase') ||
     e.request.url.includes('instagram') ||
     e.request.url.includes('googleapis')) {
    return e.respondWith(fetch(e.request));
  }
  // Otros assets: cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
