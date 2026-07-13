'use strict';

/* ============================================
   ARJONA +AI STUDIO — SERVICE WORKER
   Cleaned: duplicate listeners removed, artifacts removed
   ============================================ */

var CACHE = 'arjona-v12';
var FILES = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/animations.js',
    '/physics.js',
    '/api-client.js',
    '/install.js',
    '/manifest.json'
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
                return caches.match('/index.html');
            });
        })
    );
});
