import { createHash } from 'crypto';
import { computeParamsHash } from '../../lib/og-common';
import { OgContext } from '../services/auth';

export function generateCacheKey(pinId: number, ctx: OgContext, queryParams: any): { cacheKey: string, lockKey: string } {
    let overridesHash = '';
    const overrides: Record<string, string> = {};
    const reservedKeys = ['b', 'sig', 'ver', 'ts', 'tokenId']; // 't' is excluded via logic below

    Object.keys(queryParams).forEach(key => {
        // Exclude reserved AND 't' (Time) from cache key
        if (!reservedKeys.includes(key) && key !== 't') {
            overrides[key] = queryParams[key];
        }
    });

    if (Object.keys(overrides).length > 0) overridesHash = computeParamsHash(overrides);

    const cacheKeyRaw = `og:v2:${pinId}:${ctx.cacheVer}:${ctx.cacheParamsHash}:${overridesHash}:${ctx.cacheTs}`;
    const cacheKey = createHash('sha256').update(cacheKeyRaw).digest('hex');
    const lockKey = `lock:${cacheKey}`;

    return { cacheKey, lockKey };
}
