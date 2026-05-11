class SimpleCache {
  constructor(defaultTTL = 300000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    const expires = Date.now() + ttl;
    this.cache.set(key, { value, expires });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  keys() {
    return Array.from(this.cache.keys());
  }

  // Clean expired items
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

const dashboardCache = new SimpleCache(60000); // 1 minute
const metadataCache = new SimpleCache(300000); // 5 minutes

module.exports = { SimpleCache, dashboardCache, metadataCache };
