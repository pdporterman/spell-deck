// Offline support. Bump VERSION whenever any file changes so installed copies refresh.
const VERSION = 'spelldeck-v20';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'icons/icon-180.png?v=2', 'icons/icon-192.png?v=2', 'icons/icon-512.png?v=2',
  'js/main.js', 'js/store.js', 'js/nav.js', 'js/ui.js', 'js/theme.js', 'js/data.js', 'js/process.js', 'js/fmt.js', 'js/icons.js',
  'js/cards.js', 'js/rules.js', 'js/res.js', 'js/filters.js', 'js/lists.js', 'js/pickers.js', 'js/charform.js',
  'js/pages/sheet.js', 'js/pages/counters.js', 'js/pages/traits.js', 'js/pages/class.js', 'js/pages/spells.js', 'js/pages/resources.js', 'js/pages/ref.js', 'js/pages/settings.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network first (so uploads show up right away), cache when offline.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(r => { if (r && r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return r; })
    .catch(() => caches.match(req).then(h => h || caches.match('index.html'))));
});
