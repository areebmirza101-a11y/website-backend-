// High-performance In-Memory TTL Cache for public storefront APIs
class MemoryCache {
  constructor() {
    this.map = new Map();
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.map.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlMs = 30000) {
    this.map.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
    // periodic cleanup
    if (this.map.size > 200) {
      const now = Date.now();
      for (const [k, v] of this.map.entries()) {
        if (now > v.expiry) this.map.delete(k);
      }
    }
  }

  invalidate(pattern) {
    if (!pattern) {
      this.map.clear();
      return;
    }
    for (const k of this.map.keys()) {
      if (k.includes(pattern)) {
        this.map.delete(k);
      }
    }
  }
}

const cache = new MemoryCache();

module.exports = cache;

