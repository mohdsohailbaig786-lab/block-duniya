'use strict';
const CACHE = 'block-duniya-v1';
const ROOT = new URL('./', self.location.href);
const ENGINE = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.min.js';
const ASSETS = ['./', './index.html', './offline.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'].map(path => new URL(path, ROOT).href).concat(ENGINE);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('block-duniya-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;
  const local = url.origin === ROOT.origin && url.pathname.startsWith(ROOT.pathname);
  if (!local && url.href !== ENGINE) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Query strings must not prevent the app shell working offline.
    const key = local ? new Request(url.origin + url.pathname) : request;
    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request);
        if (response.ok) { await cache.put(key, response.clone()); return response; }
        return (await cache.match(key)) || (await cache.match(new URL('./offline.html', ROOT).href));
      } catch (_) {
        return (await cache.match(key)) || (await cache.match(new URL('./offline.html', ROOT).href));
      }
    }
    const hit = await cache.match(key);
    if (hit) return hit;
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') await cache.put(key, response.clone());
    return response;
  })());
});
