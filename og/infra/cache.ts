import Redis from 'ioredis';
import { REDIS_URL } from '../utils/constants';

// Initialize Redis
export const redis = new Redis(REDIS_URL, {
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
    }
});

// In-memory LRU fallback
export const memoryCache = new Map<string, { data: Buffer, expires: number }>();
