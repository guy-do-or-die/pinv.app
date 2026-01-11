import Redis from 'ioredis';
import {
    REDIS_URL,
    REDIS_CONNECT_TIMEOUT,
    REDIS_MAX_RETRIES,
    REDIS_RETRY_LIMIT,
    REDIS_RETRY_DELAY_BASE,
    REDIS_RETRY_DELAY_MAX
} from '../utils/constants';

// Initialize Redis
export const redis = new Redis(REDIS_URL, {
    connectTimeout: REDIS_CONNECT_TIMEOUT,
    maxRetriesPerRequest: REDIS_MAX_RETRIES,
    enableOfflineQueue: false, // Fail fast if disconnected
    retryStrategy: (times) => {
        if (times > REDIS_RETRY_LIMIT) return null; // Stop retrying after limit
        return Math.min(times * REDIS_RETRY_DELAY_BASE, REDIS_RETRY_DELAY_MAX);
    }
});

// Prevent crash on connection error
redis.on('error', (err) => {
    // Suppress connection errors to allow fallback to memory cache
    console.warn('[Redis] Connection failed, falling back to memory cache:', err.message);
});


// Safe LRU Cache (Bounded)
class SafeLRUCache<K, V> {
    private map: Map<K, V>;
    private readonly MAX_SIZE = 500; // ~50MB limit

    constructor() {
        this.map = new Map<K, V>();
    }

    get(key: K): V | undefined {
        return this.map.get(key);
        // Note: For strict LRU, we would re-insert here, but for simple bounding, 
        // FIFO/Insertion order is sufficient and faster.
    }

    set(key: K, value: V): void {
        // Eviction Policy
        if (this.map.size >= this.MAX_SIZE) {
            const oldestKey = this.map.keys().next().value;
            if (oldestKey !== undefined) {
                this.map.delete(oldestKey);
            }
        }
        this.map.set(key, value);
    }
}

// Export Singleton
export const memoryCache = new SafeLRUCache<string, { data: Buffer, expires: number }>();

