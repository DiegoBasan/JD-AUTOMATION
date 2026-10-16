/* Service worker: red primero y caché de respaldo (incluye el modelo 3D y three.js del CDN). */
const CACHE = 'kasalis3d-v6';
const CORE = ['./', 'index.html', 'js/app.js', 'js/scene.js', 'js/cycle.js', 'js/vision.js', 'js/visalgo.js', 'js/vislab.js', 'vis.html', 'models/kasalis.glb', 'manifest.webmanifest', 'icons/icon-180.png',
  '../shared/theme.js', '../buscador-kasalis/data/fallas.js', '../buscador-kasalis/data/procedimientos.js', '../shared/procs.js',  '../shared/kasalis-codes.js', '../shared/kasalis.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request, {ignoreSearch: true})));
});
