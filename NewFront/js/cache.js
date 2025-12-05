// =====================================================
// Data Cache Manager
// Minimizes API requests by caching data with expiration
// =====================================================

class DataCacheManager {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
    }

    /**
     * Store data in cache
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    set(key, data, ttl = null) {
        const expiresAt = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, {
            data,
            expiresAt,
            timestamp: Date.now()
        });
        
        // Also store in sessionStorage for persistence across page reloads
        try {
            sessionStorage.setItem(`cache_${key}`, JSON.stringify({
                data,
                expiresAt,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Failed to store in sessionStorage:', e);
        }
        
        return this;
    }

    /**
     * Get data from cache
     * @param {string} key - Cache key
     * @returns {*} Cached data or null if expired/not found
     */
    get(key) {
        // Check memory cache first
        let cached = this.cache.get(key);
        
        // Fallback to sessionStorage
        if (!cached) {
            try {
                const stored = sessionStorage.getItem(`cache_${key}`);
                if (stored) {
                    cached = JSON.parse(stored);
                    this.cache.set(key, cached);
                }
            } catch (e) {
                console.warn('Failed to retrieve from sessionStorage:', e);
            }
        }

        if (!cached) return null;

        // Check if expired
        if (Date.now() > cached.expiresAt) {
            this.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Check if cache has valid data
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Delete from cache
     * @param {string} key - Cache key
     */
    delete(key) {
        this.cache.delete(key);
        try {
            sessionStorage.removeItem(`cache_${key}`);
        } catch (e) {
            console.warn('Failed to remove from sessionStorage:', e);
        }
        return this;
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        
        // Clear all cache items from sessionStorage
        try {
            const keys = Object.keys(sessionStorage);
            keys.forEach(key => {
                if (key.startsWith('cache_')) {
                    sessionStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.warn('Failed to clear sessionStorage:', e);
        }
        
        return this;
    }

    /**
     * Clear expired cache entries
     */
    clearExpired() {
        const now = Date.now();
        
        // Clear from memory
        for (const [key, value] of this.cache.entries()) {
            if (now > value.expiresAt) {
                this.cache.delete(key);
            }
        }

        // Clear from sessionStorage
        try {
            const keys = Object.keys(sessionStorage);
            keys.forEach(key => {
                if (key.startsWith('cache_')) {
                    try {
                        const stored = JSON.parse(sessionStorage.getItem(key));
                        if (now > stored.expiresAt) {
                            sessionStorage.removeItem(key);
                        }
                    } catch (e) {
                        // Invalid data, remove it
                        sessionStorage.removeItem(key);
                    }
                }
            });
        } catch (e) {
            console.warn('Failed to clear expired from sessionStorage:', e);
        }

        return this;
    }

    /**
     * Get cache info
     */
    getInfo(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        return {
            key,
            size: JSON.stringify(cached.data).length,
            age: Date.now() - cached.timestamp,
            ttl: cached.expiresAt - Date.now(),
            expiresAt: new Date(cached.expiresAt).toISOString()
        };
    }

    /**
     * Get all cache keys
     */
    keys() {
        return Array.from(this.cache.keys());
    }

    /**
     * Get cache size
     */
    size() {
        return this.cache.size;
    }

    /**
     * Invalidate cache by pattern
     * @param {RegExp|string} pattern - Pattern to match keys
     */
    invalidatePattern(pattern) {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.delete(key);
            }
        }

        return this;
    }

    /**
     * Wrapper for API calls with caching
     * @param {string} key - Cache key
     * @param {Function} fetchFn - Function to fetch data
     * @param {number} ttl - Time to live
     */
    async fetch(key, fetchFn, ttl = null) {
        // Check cache first
        const cached = this.get(key);
        if (cached !== null) {
            console.log(`📦 Cache HIT for: ${key}`);
            return cached;
        }

        console.log(`🌐 Cache MISS for: ${key} - Fetching...`);
        
        // Fetch fresh data
        const data = await fetchFn();
        
        // Store in cache
        this.set(key, data, ttl);
        
        return data;
    }

    /**
     * Refresh cache entry
     * @param {string} key - Cache key
     * @param {Function} fetchFn - Function to fetch data
     * @param {number} ttl - Time to live
     */
    async refresh(key, fetchFn, ttl = null) {
        console.log(`🔄 Refreshing cache for: ${key}`);
        this.delete(key);
        return await this.fetch(key, fetchFn, ttl);
    }
}

// Create global instance
const dataCache = new DataCacheManager();

// Clear expired entries every 5 minutes
setInterval(() => {
    dataCache.clearExpired();
    console.log('🧹 Cleared expired cache entries');
}, 5 * 60 * 1000);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataCacheManager, dataCache };
}
