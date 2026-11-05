/* Service worker — Monuments du Monde
   Changez VERSION à chaque mise en ligne (et après chaque régénération de data/world),
   ainsi que le ?v= de i18n.js et landmarks.js ici et dans index.html
   pour que les joueurs reçoivent la nouvelle version. */
const VERSION = 'mdm-v2.12.0';
const CORE = ['./', './index.html', './i18n.js?v=2.12.0', './landmarks.js?v=2.12.0', './sprites.js?v=2.12.0', './manifest.json', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './data/world/top.json', './data/world/index.json', './data/regions.json'];
const DATA = 'mdm-data-' + VERSION;   // tuiles de monuments déjà consultées (hors-ligne)
const RUNTIME = 'mdm-runtime-v1';     // Leaflet (CDN)
const TILES = 'mdm-maptiles-v2';      // fonds de carte vectoriels déjà consultés (style, tuiles, polices)
const MAX_TILES = 1500;
const CDN_HOSTS = ['unpkg.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => ![VERSION, DATA, RUNTIME, TILES].includes(k)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Le cache ne doit jamais empêcher l'affichage : une mémoire pleine ou capricieuse (iPhone) est simplement ignorée.
const offline = () => new Response('', {status: 504, statusText: 'Offline'});
const openCache = name => caches.open(name).catch(() => null);
const keep = (c, req, res) => c ? c.put(req, res).catch(() => {}) : Promise.resolve();

// Ménage du cache des fonds de carte : de temps en temps seulement (le faire à chaque tuile ralentissait les téléphones).
let trimming = false, puts = 0;
async function trim(cacheName, max) {
  if (trimming || ++puts % 40) return;
  trimming = true;
  try {
    const c = await caches.open(cacheName), keys = await c.keys();
    for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
  } catch (e) { /* pas grave */ }
  trimming = false;
}

async function cacheFirst(req, cacheName, maxEntries) {
  const c = await openCache(cacheName);
  const hit = c && await c.match(req).catch(() => null);
  if (hit) return hit;
  let res;
  try { res = await fetch(req); } catch (e) { return offline(); }
  if (res.ok) keep(c, req, res.clone()).then(() => { if (maxEntries) trim(cacheName, maxEntries); });
  return res;
}

// Réseau d'abord, cache en secours : pour les fichiers qui changent souvent (style de la carte, index des tuiles).
// Réseau très lent (une barre de 4G) : la copie gardée est utilisée au bout de 4 s.
async function networkFirst(req, cacheName) {
  const c = await openCache(cacheName);
  const net = fetch(req).then(res => { if (res.ok) keep(c, req, res.clone()); return res; });
  const hit = c && await c.match(req).catch(() => null);
  if (!hit) return net.catch(() => offline());
  return Promise.race([net.catch(() => hit), new Promise(r => setTimeout(() => r(hit), 4000))]);
}

async function staleWhileRevalidate(req) {
  const c = await openCache(VERSION);
  const hit = c && await c.match(req).catch(() => null);
  const net = fetch(req).then(res => { if (res.ok) keep(c, req, res.clone()); return res; });
  if (hit) { net.catch(() => {}); return hit; }
  return net.catch(() => offline());
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Pages : réseau d'abord (mises à jour rapides), cache en secours (hors-ligne).
  if (req.mode === 'navigate') {
    // Seule la page du jeu est gardée pour le hors-ligne ; les autres pages du site (installation, test 3D) passent directement.
    const home = new URL('./', self.location).pathname;
    if (url.pathname !== home && url.pathname !== home + 'index.html') return;
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); openCache(VERSION).then(c => keep(c, './index.html', copy)); return res;
    }).catch(() => caches.match('./index.html').then(r => r || offline())));
    return;
  }
  if (url.origin === self.location.origin) {
    e.respondWith(url.pathname.includes('/data/world/t/') ? cacheFirst(req, DATA) : staleWhileRevalidate(req));
    return;
  }
  if (CDN_HOSTS.includes(url.hostname)) { e.respondWith(cacheFirst(req, RUNTIME)); return; }
  // Fond de la carte 2D de secours (OpenStreetMap) : gardé comme les tuiles de la carte 3D, pour solliciter le moins possible leurs serveurs.
  if (url.hostname === 'tile.openstreetmap.org') { e.respondWith(cacheFirst(req, TILES, MAX_TILES)); return; }
  if (url.hostname === 'tiles.openfreemap.org') {
    // Tuiles, polices et icônes ne changent pas à adresse égale ; le style, lui, est mis à jour chaque semaine.
    const fixed = /\.(pbf|png|json)$/.test(url.pathname) && !url.pathname.startsWith('/styles/');
    e.respondWith(fixed ? cacheFirst(req, TILES, MAX_TILES) : networkFirst(req, TILES));
    return;
  }
  // Tout le reste (Wikipédia, Wikidata, publicités, paiement) passe directement par le réseau ;
  // le jeu met lui-même en cache les monuments découverts et leurs descriptions (IndexedDB).
});

// Notifications envoyées par le serveur (amis, bourse, messages, compét'), même quand le jeu est fermé.
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = {body: e.data && e.data.text()}; }
  e.waitUntil(self.registration.showNotification(d.title || 'Monuments du Monde', {
    body: d.body || '', icon: './icons/icon-192.png', badge: './icons/icon-192.png', tag: d.tag, renotify: !!d.tag, data: {url: d.url || './'},
  }));
});
// Toucher la notification ouvre le jeu (ou le ramène au premier plan s'il est déjà ouvert).
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow(e.notification.data && e.notification.data.url || './');
  }));
});
