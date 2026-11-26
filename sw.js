'use strict';
const CACHE = 'block-duniya-v2';
const ROOT = new URL('./', self.location.href);
const SHELL = new URL('index.html', ROOT).href;
const ENGINE = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.min.js';
const ASSETS = ['index.html','manifest.json','icon-192.png','icon-512.png','icon-maskable-512.png'].map(p => new URL(p, ROOT).href).concat(ENGINE);
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('block-duniya-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const local = u.origin === ROOT.origin && u.pathname.startsWith(ROOT.pathname);
  const shell = local && (u.pathname === ROOT.pathname || u.pathname === new URL(SHELL).pathname);
  if (!local && u.href !== ENGINE) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const key = shell ? SHELL : local ? u.origin + u.pathname : ENGINE;
    if (shell) {
      try {
        const response = await fetch(r);
        if (!response.ok) throw new Error('App shell unavailable');
        await c.put(SHELL, response.clone());
        return response;
      } catch (error) {
        const hit = await c.match(SHELL);
        if (hit) return hit;
        throw error;
      }
    }
    const hit = await c.match(key);
    if (hit) return hit;
    const response = await fetch(r);
    if (response.ok) await c.put(key, response.clone());
    return response;
  })());
});
