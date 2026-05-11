/**
 * Frontend Cache & LocalStorage Manager
 */

const CACHE_PREFIX = 'sm_';
const DEFAULT_TTL = 5 * 60 * 1000;

const Cache = {
    get(key) {
        try {
            const item = localStorage.getItem(CACHE_PREFIX + key);
            if (!item) return null;
            const { data, expiry } = JSON.parse(item);
            if (expiry && Date.now() > expiry) {
                localStorage.removeItem(CACHE_PREFIX + key);
                return null;
            }
            return data;
        } catch (e) { return null; }
    },

    set(key, data, ttl = DEFAULT_TTL) {
        try {
            const item = { data, expiry: ttl > 0 ? Date.now() + ttl : null };
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
        } catch (e) { this.cleanup(); }
    },

    remove(key) { localStorage.removeItem(CACHE_PREFIX + key); },

    clear() {
        Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX))
            .forEach(k => localStorage.removeItem(k));
    },

    cleanup() {
        Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX))
            .forEach(k => {
                try {
                    const item = JSON.parse(localStorage.getItem(k));
                    if (item.expiry && Date.now() > item.expiry) localStorage.removeItem(k);
                } catch (e) { localStorage.removeItem(k); }
            });
    },

    async fetch(endpoint, fetcher, options = {}) {
        const { ttl = DEFAULT_TTL, force = false, cacheKey = endpoint } = options;
        if (!force) {
            const cached = this.get(cacheKey);
            if (cached !== null) return { data: cached, fromCache: true };
        }
        try {
            const data = await fetcher();
            this.set(cacheKey, data, ttl);
            return { data, fromCache: false };
        } catch (err) {
            const stale = this.get(cacheKey);
            if (stale !== null) return { data: stale, fromCache: true, stale: true };
            throw err;
        }
    }
};

const SessionCache = {
    store: new Map(),
    get(key) {
        const item = this.store.get(key);
        if (!item) return null;
        if (item.expiry && Date.now() > item.expiry) { this.store.delete(key); return null; }
        return item.data;
    },
    set(key, data, ttl = DEFAULT_TTL) {
        this.store.set(key, { data, expiry: ttl > 0 ? Date.now() + ttl : null });
    },
    remove(key) { this.store.delete(key); },
    clear() { this.store.clear(); }
};

const DataSync = {
    intervals: new Map(),
    start(key, fetcher, intervalMs = 30000, onUpdate) {
        this.stop(key);
        const refresh = async () => {
            try {
                const data = await fetcher();
                Cache.set(key, data, intervalMs * 2);
                if (onUpdate) onUpdate(data);
            } catch (e) { console.warn(`Sync failed for ${key}:`, e.message); }
        };
        refresh();
        this.intervals.set(key, setInterval(refresh, intervalMs));
    },
    stop(key) {
        if (this.intervals.has(key)) { clearInterval(this.intervals.get(key)); this.intervals.delete(key); }
    },
    stopAll() { this.intervals.forEach(t => clearInterval(t)); this.intervals.clear(); }
};

const OfflineQueue = {
    getQueue() {
        try { return JSON.parse(localStorage.getItem(CACHE_PREFIX + 'mutation_queue') || '[]'); }
        catch (e) { return []; }
    },
    saveQueue(queue) { localStorage.setItem(CACHE_PREFIX + 'mutation_queue', JSON.stringify(queue)); },
    add(mutation) {
        const queue = this.getQueue();
        queue.push({ ...mutation, id: Date.now(), retries: 0 });
        this.saveQueue(queue);
    },
    remove(id) { this.saveQueue(this.getQueue().filter(m => m.id !== id)); },
    clear() { localStorage.removeItem(CACHE_PREFIX + 'mutation_queue'); }
};

window.AppCache = Cache;
window.SessionCache = SessionCache;
window.DataSync = DataSync;
window.OfflineQueue = OfflineQueue;
