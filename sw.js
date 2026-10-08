const CACHE = 'research-desk-v3';
const ASSETS = ['./index.html', './styles.css', './app.js', './manifest.json', './icons/icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('research-desk-') && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin || event.request.method !== 'GET' || url.pathname.includes('/data/')) return;
  event.respondWith(fetch(event.request).then(res => {
    if (res.ok) {const copy = res.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));}
    return res;
  }).catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
