const CACHE = 'urban-padel-v3';
const ASSETS = ['/img/favicon.png', '/img/logo.png', '/manifest.json'];

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
  // Otros assets: cache first, y lo que se trae de red se guarda para la
  // próxima — antes solo servía de caché los 3 archivos precargados en
  // install() y nunca guardaba nada más (js/css/fuentes), así que la app
  // "instalada" no funcionaba sin internet más allá de la primera carga.
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(res && res.ok && e.request.method==='GET'){
          const copy=res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
