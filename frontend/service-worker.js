const CACHE_NAME = 'student-mgmt-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/students.html',
    '/student-form.html',
    '/scores.html',
    '/courses.html',
    '/classes.html',
    '/agent.html',
    '/logs.html',
    '/reports.html',
    '/analytics.html',
    '/import.html',
    '/system.html',
    '/settings.html',
    '/profile.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/charts.js',
    '/js/components.js',
    '/js/shortcuts.js',
    '/js/utils.js',
    '/manifest.json',
    '/404.html',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

const API_CACHE_NAME = 'student-mgmt-api-v1';
const API_ROUTES = ['/api/dashboard', '/api/students', '/api/courses', '/api/classes'];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== API_CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // API requests: network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(apiStrategy(request));
        return;
    }

    // Static assets: cache first, network fallback
    event.respondWith(staticStrategy(request));
});

async function staticStrategy(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // Fallback for HTML pages when offline
        if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
        }
        throw err;
    }
}

async function apiStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) {
            // Mark as stale
            const headers = new Headers(cached.headers);
            headers.set('X-Cache', 'stale');
            return new Response(cached.body, { status: 200, statusText: 'OK', headers });
        }
        // Return offline JSON response
        return new Response(
            JSON.stringify({ success: false, message: '当前处于离线模式，请检查网络连接', offline: true }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// Background sync for pending mutations
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-mutations') {
        event.waitUntil(syncMutations());
    }
});

async function syncMutations() {
    const db = await openIndexedDB();
    const tx = db.transaction('mutations', 'readonly');
    const store = tx.objectStore('mutations');
    const mutations = await store.getAll();

    for (const mut of mutations) {
        try {
            await fetch(mut.url, {
                method: mut.method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mut.body)
            });
            const delTx = db.transaction('mutations', 'readwrite');
            delTx.objectStore('mutations').delete(mut.id);
        } catch (e) {
            console.error('Sync mutation failed:', e);
        }
    }
}

function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('student-mgmt-db', 1);
        req.onupgradeneeded = (e) => {
            e.target.result.createObjectStore('mutations', { keyPath: 'id', autoIncrement: true });
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e);
    });
}

// Push notification support
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    event.waitUntil(
        self.registration.showNotification(data.title || '学生管理系统', {
            body: data.message || '您有一条新通知',
            icon: data.icon || '/manifest-icon-192.png',
            badge: '/manifest-icon-96.png',
            tag: data.tag || 'default',
            requireInteraction: false
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/dashboard.html')
    );
});
