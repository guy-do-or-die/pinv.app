import { FastifyReply } from 'fastify';
import { redis, memoryCache } from '../infra/cache';
import { REVALIDATE_TTL, LOCK_TTL } from '../utils/constants';
import { getStubImage } from '../infra/renderer';
import { logToFile } from '../utils/logger';

interface SwrOptions {
    pinId: number;
    cacheKey: string;
    lockKey: string;
    generatorFn: () => Promise<Buffer>;
    reply: FastifyReply;
    forceRefresh: boolean; // ?t=...
    isBundle: boolean;
}

export async function serveWithSWR({ pinId, cacheKey, lockKey, generatorFn, reply, forceRefresh, isBundle }: SwrOptions) {
    logToFile(`[SWR] Serving ${pinId} key=${cacheKey} Refresh=${forceRefresh}`);

    // Helper: Safe Redis Call
    const safeRedis = async <T>(operation: () => Promise<T>, fallback: T): Promise<T> => {
        if (redis.status !== 'ready') return fallback;
        try {
            return await operation();
        } catch (e) {
            logToFile(`[SWR] Redis Error: ${(e as Error).message}`);
            return fallback;
        }
    };

    // 1. Check Memory/Redis
    let cachedBuffer: Buffer | null = null;
    const memCached = memoryCache.get(cacheKey);
    if (memCached) {
        cachedBuffer = memCached.data;
    }

    if (!cachedBuffer) {
        logToFile('[SWR] Checking Redis...');
        cachedBuffer = await safeRedis(() => redis.getBuffer(cacheKey), null);

        // Read-Through Optimization: Populate L1 if found in L2
        if (cachedBuffer) {
            memoryCache.set(cacheKey, { data: cachedBuffer, expires: Date.now() + REVALIDATE_TTL * 1000 });
        }
    }

    // 2. HIT
    if (cachedBuffer) {
        const freshKey = `fresh:${cacheKey}`;
        const isFresh = await safeRedis(() => redis.exists(freshKey), 0);

        logToFile(`[SWR] HIT. Fresh=${isFresh}, Force=${forceRefresh}`);

        // Serve Cache IF:
        // A. It is FRESH
        // B. It is STALE AND user is NOT forcing refresh
        if (isFresh || !forceRefresh) {
            const dynamicTTL = isBundle ? 60 : REVALIDATE_TTL;
            reply.header('Content-Type', 'image/png');
            reply.header('Cache-Control', `public, max-age=${dynamicTTL}, stale-while-revalidate=${dynamicTTL}`);

            const hitType = isFresh ? 'HIT-FRESH' : 'HIT-SWR';
            reply.header('X-Cache', hitType);
            reply.send(cachedBuffer);

            // Background Update (only if stale)
            if (!isFresh) {
                const isLocked = await safeRedis(() => redis.exists(lockKey), 0);
                if (!isLocked && redis.status === 'ready') {
                    await safeRedis(() => redis.set(lockKey, '1', 'EX', LOCK_TTL, 'NX'), null);
                    setTimeout(() => {
                        logToFile(`[SWR] Background Update for ${pinId}`);
                        redis.set(freshKey, '1', 'EX', REVALIDATE_TTL).catch(() => { });
                        generatorFn()
                            .then(async (buf) => {
                                // Update Memory
                                memoryCache.set(cacheKey, { data: buf, expires: Date.now() + REVALIDATE_TTL * 1000 });
                                // Update Redis
                                await redis.set(cacheKey, buf, 'EX', REVALIDATE_TTL * 10);
                                await redis.del(lockKey);
                            })
                            .catch(e => {
                                logToFile(`[OG] Background SWR Failed: ${e.message}`);
                                redis.del(lockKey).catch(() => { });
                                redis.del(freshKey).catch(() => { });
                            });
                    }, 500);
                }
            }
            return;
        }
        logToFile(`[OG] Cache STALE + Forced Refresh. Skipping SWR.`);
    }

    // 3. MISS (or Force Refresh) - Synchronous Generation
    try {
        logToFile('[SWR] MISS. Generating...');
        // Try Lock
        let acquired = await safeRedis(() => redis.set(lockKey, '1', 'EX', LOCK_TTL, 'NX'), null);

        // If Redis is down, we treat 'acquired' as null/false by default for safeRedis.
        // BUT if Redis is down, we should NOT wait/poll, we should just Generate (concurrently).
        // So: If Redis not ready -> acquired = 'OK' (fake acquire).
        if (redis.status !== 'ready') acquired = 'OK';

        // Coalescing / Polling (Only if Redis worked and someone else holds lock)
        if (!acquired) {
            logToFile('[SWR] Locked. Polling...');
            let retries = 20;
            while (retries > 0) {
                await new Promise(r => setTimeout(r, 500));
                const fresh = await safeRedis(() => redis.getBuffer(cacheKey), null);
                if (fresh) {
                    reply.header('Content-Type', 'image/png');
                    reply.header('X-Cache', 'HIT-POLL');
                    return reply.send(fresh);
                }
                retries--;
            }
            return reply.code(504).type('image/png').send(getStubImage('Timeout'));
        }

        // Generate Fresh
        const freshBuffer = await generatorFn();
        logToFile('[SWR] Generated Fresh Buffer');

        // Update Caches
        memoryCache.set(cacheKey, { data: freshBuffer, expires: Date.now() + REVALIDATE_TTL * 1000 });

        if (redis.status === 'ready') {
            const freshKey = `fresh:${cacheKey}`;
            await redis.del(lockKey).catch(() => { });
            await redis.set(cacheKey, freshBuffer, 'EX', REVALIDATE_TTL * 10).catch(() => { });
            await redis.set(freshKey, '1', 'EX', REVALIDATE_TTL).catch(() => { });
        }

        const dynamicTTL = isBundle ? 60 : REVALIDATE_TTL;
        reply.header('Content-Type', 'image/png');
        reply.header('Cache-Control', `public, max-age=${dynamicTTL}, stale-while-revalidate=${dynamicTTL}`);
        reply.header('X-Cache', 'MISS');
        return reply.send(freshBuffer);

    } catch (e: any) {
        if (e.message !== 'NO_UI_CODE') {
            logToFile(`[SWR] Error: ${e.message}`);
            console.error(e);
        } else {
            logToFile(`[SWR] Handled Soft Failure: ${e.message}`);
        }

        if (redis.status === 'ready') {
            await redis.del(lockKey).catch(() => { });
        }

        if (e.message === 'PIN_NOT_FOUND') {
            return reply.code(404).type('image/png').send(getStubImage('Not Found'));
        }
        if (e.message === 'NO_UI_CODE') {
            return reply.code(200).type('image/png').send(getStubImage('No Code'));
        }
        if (e.message === 'RENDER_FAILED') {
            return reply.code(500).type('image/png').send(getStubImage('Render Error'));
        }

        return reply.code(500).type('image/png').send(getStubImage('Error'));
    }
}
