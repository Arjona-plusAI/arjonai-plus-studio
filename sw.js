'use strict';

/* ============================================
   ARJONA +AI STUDIO — SERVICE WORKER
   Cleaned: duplicate listeners removed, artifacts removed
   ============================================ */

var CACHE = 'arjona-v26';
var FILES = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './animations.js',
    './physics.js',
    './api-client.js',
    './install.js',
    './manifest.json'
];

/* ===== INSTALL ===== */
self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE).then(function (c) {
            return c.addAll(FILES);
        }).then(function () {
            return self.skipWaiting();
        }).catch(function (err) {
            console.warn('Cache err:', err);
        })
    );
});

/* ===== ACTIVATE ===== */
self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (k) {
                    return k !== CACHE;
                }).map(function (k) {
                    return caches.delete(k);
                })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

/* ===== FETCH ===== */
self.addEventListener('fetch', function (e) {
    if (e.request.method !== 'GET') return;

    // Never intercept the APK download: let the browser fetch it directly
    // instead of being served from cache or any fallback route.
    if (e.request.url.indexOf('ArjonaAI.apk') !== -1) return;

    // NETWORK-FIRST for page navigations (the HTML document itself).
    // This prevents the app from ever getting stuck showing a stale or
    // incorrectly-typed cached copy of index.html on startup (the "raw HTML
    // code" bug). We only fall back to the cached copy if the network is
    // truly unreachable (offline).
    var isNavigation = e.request.mode === 'navigate' ||
        (e.request.method === 'GET' && e.request.headers.get('accept') &&
            e.request.headers.get('accept').indexOf('text/html') !== -1);

    if (isNavigation) {
        e.respondWith(
            fetch(e.request).then(function (res) {
                if (res && res.status === 200) {
                    var clone = res.clone();
                    caches.open(CACHE).then(function (c) {
                        c.put(e.request, clone);
                    });
                }
                return res;
            }).catch(function () {
                return caches.match(e.request).then(function (cached) {
                    return cached || caches.match('./index.html');
                });
            })
        );
        return;
    }

    // CACHE-FIRST for everything else (JS/CSS/images/manifest, etc.)
    e.respondWith(
        caches.match(e.request).then(function (cached) {
            if (cached) return cached;
            return fetch(e.request).then(function (res) {
                if (res && res.status === 200) {
                    var clone = res.clone();
                    caches.open(CACHE).then(function (c) {
                        c.put(e.request, clone);
                    });
                }
                return res;
            }).catch(function () {
                return caches.match('./index.html');
            });
        })
    );
});
