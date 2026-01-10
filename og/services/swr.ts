import { FastifyReply } from 'fastify';
import { redis, memoryCache } from '../infra/cache';
import { REVALIDATE_TTL, LOCK_TTL } from '../utils/constants';
import { getStubImage } from '../infra/renderer';

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
    // 1. Check Memory/Redis
    let cachedBuffer: Buffer | null = null;
    const memCached = memoryCache.get(cacheKey);
    if (memCached) cachedBuffer = memCached.data;

    if (!cachedBuffer) {
        try {
            cachedBuffer = await redis.getBuffer(cacheKey);
        } catch (e) { }
    }

    // 2. HIT
    if (cachedBuffer) {
        const freshKey = `fresh:${cacheKey}`;
        const isFresh = await redis.exists(freshKey);

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
                const isLocked = await redis.exists(lockKey);
                if (!isLocked) {
                    await redis.set(lockKey, '1', 'EX', LOCK_TTL, 'NX');
                    setTimeout(() => {
                        console.log(`[OG] SWR: Starting background update for ${pinId}`);
                        redis.set(freshKey, '1', 'EX', REVALIDATE_TTL);
                        generatorFn()
                            .then(() => redis.del(lockKey))
                            .catch(e => {
                                console.error("[OG] Background SWR Failed:", e);
                                redis.del(lockKey);
                                redis.del(freshKey);
                            });
                    }, 500);
                }
            }
            return;
        }
        console.log(`[OG] Cache STALE + Forced Refresh ('t'). Skipping SWR.`);
    }

    // 3. MISS (or Force Refresh) - Synchronous Generation
    try {
        const acquired = await redis.set(lockKey, '1', 'EX', LOCK_TTL, 'NX');

        // Coalescing / Polling (Wait for existing lock)
        if (!acquired) {
            let retries = 20;
            while (retries > 0) {
                await new Promise(r => setTimeout(r, 500));
                const fresh = await redis.getBuffer(cacheKey);
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
        await redis.del(lockKey);

        const dynamicTTL = isBundle ? 60 : REVALIDATE_TTL;
        reply.header('Content-Type', 'image/png');
        reply.header('Cache-Control', `public, max-age=${dynamicTTL}, stale-while-revalidate=${dynamicTTL}`);
        reply.header('X-Cache', 'MISS');
        return reply.send(freshBuffer);

    } catch (e: any) {
        console.error(e);
        await redis.del(lockKey);

        if (e.message === 'PIN_NOT_FOUND') {
            return reply.code(404).type('image/png').send(getStubImage('Not Found'));
        }
        if (e.message === 'NO_UI_CODE') {
            return reply.code(422).type('image/png').send(getStubImage('No Code'));
        }
        if (e.message === 'RENDER_FAILED') {
            return reply.code(500).type('image/png').send(getStubImage('Render Error'));
        }

        return reply.code(500).type('image/png').send(getStubImage('Error'));
    }
}
