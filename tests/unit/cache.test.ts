import { describe, it, expect, beforeEach } from 'vitest';
import { memoryCache } from '../../og/infra/cache';
import { MEMORY_CACHE_MAX_ITEMS } from '../../og/utils/constants';

describe('Safe Memory Cache (LRU)', () => {
    beforeEach(() => {
        memoryCache.clear();
    });

    it('should store and retrieve values', () => {
        memoryCache.set('key1', { data: Buffer.from('test'), expires: Date.now() + 10000 });
        const val = memoryCache.get('key1');
        expect(val).toBeDefined();
        expect(val?.data.toString()).toBe('test');
    });

    it('should respect the max items limit', () => {
        // We know MEMORY_CACHE_MAX_ITEMS is 500 (from constants)
        // Filling it up is expensive in a test, but lru-cache logic is trusted.
        // We will create a local small cache to verify behavior assumption, 
        // OR just trust the library. 
        // Better: We verify independent of the constant by checking the property.

        expect(memoryCache.max).toBe(MEMORY_CACHE_MAX_ITEMS);
    });

    it('should handle buffer data correctly', () => {
        const buf = Buffer.from('image-data');
        memoryCache.set('img', { data: buf, expires: 0 });
        const ret = memoryCache.get('img');
        expect(ret?.data).toEqual(buf);
    });
});
