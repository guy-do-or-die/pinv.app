import fastify from 'fastify';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import { getPin } from './lib/pin';
import { parseBundle } from './lib/bundle';
import { verifySignature } from './lib/sig';
import { checkOwnership } from './lib/chain';
import { getManifest } from './lib/manifest';
import { computeParamsHash } from '../lib/og-common';
import { executeLitAction } from './lib/executor';
import cors from '@fastify/cors';
import { pinVAddress } from './lib/contracts';

// Load env from root
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true });

// Environment & Config
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_TTL = 86400; // 24 hours (Availability)
const REVALIDATE_TTL = 60; // 60 seconds (Freshness)
const LOCK_TTL = 30; // 30s lock for generation
const PORT = parseInt(process.env.PORT || '8080');
const TIMESTAMP_BUCKET_MS = parseInt(process.env.TIMESTAMP_BUCKET_MS || '60000'); // 1 minute bucketing to match TTL
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532') as 8453 | 84532;
const CONTRACT_ADDRESS = pinVAddress[CHAIN_ID] || pinVAddress[84532];

// Initialize Redis
const redis = new Redis(REDIS_URL, {
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
    }
});

// In-memory LRU fallback
const memoryCache = new Map<string, { data: Buffer, expires: number }>();

const server = fastify({
    logger: true,
    disableRequestLogging: false
});

server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
});

// Endpoint for executing Data Code (Lit Actions)
server.post('/execute', async (req, reply) => {
    try {
        const { code, params } = req.body as { code: string, params: any };
        if (!code) return reply.status(400).send({ error: "Missing code" });

        // executeLitAction now returns { result, logs }
        const { result, logs } = await executeLitAction(code, params || {});
        return reply.send({ result, logs });
    } catch (e: any) {
        req.log.error(e);
        return reply.status(500).send({ error: "Execution failed", logs: [e.message] });
    }
});

console.log('------------------------------------------------');
console.log(`[OG Engine] Starting on Port: ${PORT}`);
console.log(`[OG Engine] Chain ID: ${CHAIN_ID}`);
console.log(`[OG Engine] Contract Address: ${CONTRACT_ADDRESS}`);
console.log('------------------------------------------------');

// Helper: Stub Image
function getStubImage(text: string): Buffer {
    try {
        const prodPath = '/app/public/hero.png';
        const devPath = path.join(__dirname, '../public/hero.png');
        const imagePath = fs.existsSync(prodPath) ? prodPath : devPath;
        if (fs.existsSync(imagePath)) return fs.readFileSync(imagePath);
    } catch (e) { }
    return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');
}

// Internal Generation Function (Decoupled from Request)
async function generateOgImage(pinId: number, queryParams: Record<string, string>, authorizedBundle: any, cacheKey: string): Promise<Buffer> {
    const t0 = performance.now();
    let pin = null;

    // 1. Fetch Pin
    if (pinId === 0) {
        pin = {
            id: 0,
            title: "Preview",
            tokenURI: "",
            widget: { uiCode: "", previewData: {}, userConfig: {} }
        };
    } else {
        pin = await getPin(pinId);
    }
    const tPinFetch = performance.now();
    console.log(`[Perf] Pin Fetch: ${(tPinFetch - t0).toFixed(2)}ms`);

    if (!pin) {
        throw new Error('PIN_NOT_FOUND');
    }

    let uiCode = pin.widget?.uiCode;
    let baseProps = {
        ...(pin.widget?.previewData || {}),
        ...(pin.widget?.userConfig || {}),
    };

    // 2. Apply Overrides / Bundle
    const overrides: Record<string, string> = {};
    const reservedKeys = ['b', 'sig', 'ver', 'ts', 'tokenId', 't'];
    Object.keys(queryParams).forEach(key => {
        if (!reservedKeys.includes(key)) overrides[key] = queryParams[key];
    });

    if (authorizedBundle) {
        if (authorizedBundle.ver) {
            const manifest = await getManifest(authorizedBundle.ver);
            if (manifest && manifest.uiCode) {
                uiCode = manifest.uiCode;
                baseProps = { ...(manifest.previewData || {}), ...(manifest.userConfig || {}) };
            }
        }
        if (authorizedBundle && authorizedBundle.params) {
            const dataCode = authorizedBundle.ver ? (await getManifest(authorizedBundle.ver))?.dataCode : pin.widget?.dataCode;
            const paramsToRun = { ...authorizedBundle.params, ...overrides };
            if (dataCode) {
                const { result } = await executeLitAction(dataCode, paramsToRun);
                if (result) baseProps = { ...baseProps, ...result };
            } else {
                baseProps = { ...baseProps, ...authorizedBundle.params };
            }
        }
    } else {
        const dataCode = pin.widget?.dataCode;
        const storedParams = pin.widget?.previewData || {};
        const paramsToRun = { ...storedParams, ...overrides };
        if (dataCode) {
            const tExecStart = performance.now();
            const { result } = await executeLitAction(dataCode, paramsToRun);
            console.log(`[Perf] Lit Action: ${(performance.now() - tExecStart).toFixed(2)}ms`);
            if (result) baseProps = { ...baseProps, ...result };
        } else {
            baseProps = { ...baseProps, ...paramsToRun };
        }
    }

    if (!uiCode) {
        console.warn(`[OG] No UI Code for Pin ${pinId}`);
        throw new Error('NO_UI_CODE');
    }

    const props = { ...baseProps, title: pin.title, tagline: pin.tagline };

    // 3. Worker Render
    const width = 1200;
    const height = 800;
    const workerCmd = path.join(__dirname, 'worker.js');

    const tSpawnStart = performance.now();
    const child = spawn('bun', [workerCmd], { stdio: ['pipe', 'pipe', 'pipe'] });

    const inputPayload = JSON.stringify({
        uiCode,
        props,
        width,
        height,
        baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    });

    child.stdin.write(inputPayload);
    child.stdin.end();

    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];
    child.stdout.on('data', c => chunks.push(c));
    child.stderr.on('data', c => errChunks.push(c));

    const exitCode = await new Promise<number | null>(resolve => {
        child.on('close', resolve);
        setTimeout(() => { child.kill('SIGKILL'); resolve(-1); }, 10000);
    });

    console.log(`[Perf] Worker Total: ${(performance.now() - tSpawnStart).toFixed(2)}ms`);

    if (errChunks.length > 0) {
        console.error(Buffer.concat(errChunks).toString());
    }

    if (exitCode !== 0) {
        console.error(`[OG] Worker failed: ${exitCode}`);
        throw new Error('RENDER_FAILED');
    }

    const pngBuffer = Buffer.concat(chunks);
    if (pngBuffer.length === 0) throw new Error('Empty output');

    // 4. Cache
    try {
        await redis.set(cacheKey, pngBuffer, 'EX', CACHE_TTL);
        await redis.set(`fresh:${cacheKey}`, '1', 'EX', REVALIDATE_TTL);
    } catch (e) { }
    memoryCache.set(cacheKey, { data: pngBuffer, expires: Date.now() + 60000 }); // Local memory cache short-lived

    console.log(`[Perf] Total Gen: ${(performance.now() - t0).toFixed(2)}ms`);
    return pngBuffer;
}

// Route
server.get<{ Params: { pinId: string }, Querystring: { b?: string, sig?: string, params?: string, ver?: string, ts?: string, tokenId?: string } }>('/og/:pinId', async (request, reply) => {
    const pinId = parseInt(request.params.pinId);
    if (isNaN(pinId)) return reply.code(400).send('Invalid Pin ID');

    const { b, sig } = request.query;
    let authorizedBundle: any = null;
    let cacheParamsHash = '';
    let cacheVer = 'latest';
    let cacheTs = '';

    // 1. Auth & Bundle Parsing
    if (b) {
        const bundle = parseBundle(b);
        if (bundle) {
            let authorized = false;
            if (sig) {
                const signer = await verifySignature(pinId, bundle, sig);
                if (signer) {
                    const isOwner = (pinId === 0) ? true : await checkOwnership(signer, pinId);
                    if (isOwner) authorized = true;
                }
            } else {
                authorized = true; // Unsigned bundle allowed
            }

            if (authorized) {
                authorizedBundle = bundle;
                cacheVer = bundle.ver || 'latest';
                cacheTs = bundle.ts ? String(bundle.ts) : '';
                if (bundle.params) cacheParamsHash = computeParamsHash(bundle.params);
            }
        }
    }

    // 2. Cache Key
    let overridesHash = '';
    const queryParams = request.query as Record<string, string>;
    const overrides: Record<string, string> = {};
    const reservedKeys = ['b', 'sig', 'ver', 'ts', 'tokenId']; // 't' is NOT reserved for generation, but we handle it separately for cache key

    // We want the Cache Key to be TIME AGNOSTIC. Use the latest cached version regardless of 't'.
    // However, we MUST pass 't' to the generator so the content is fresh.
    const generationOverrides: Record<string, string> = { ...queryParams };

    // Filter overrides for Cache Key (Exclude 't')
    Object.keys(queryParams).forEach(key => {
        if (!reservedKeys.includes(key) && key !== 't') {
            overrides[key] = queryParams[key];
        }
    });

    if (Object.keys(overrides).length > 0) overridesHash = computeParamsHash(overrides);

    const cacheKeyRaw = `og:v2:${pinId}:${cacheVer}:${cacheParamsHash}:${overridesHash}:${cacheTs}`;
    const { createHash } = await import('crypto');
    const cacheKey = createHash('sha256').update(cacheKeyRaw).digest('hex');
    const lockKey = `lock:${cacheKey}`;

    // 3. SWR Strategy (Stale-While-Revalidate)
    let cachedBuffer: Buffer | null = null;

    // Check Memory First
    const memCached = memoryCache.get(cacheKey);
    if (memCached) cachedBuffer = memCached.data;

    // Check Redis
    if (!cachedBuffer) {
        try {
            cachedBuffer = await redis.getBuffer(cacheKey);
        } catch (e) { }
    }

    // Hit?
    if (cachedBuffer) {
        // Serve Stale Immediately
        reply.header('Content-Type', 'image/png');
        reply.header('X-Cache', 'HIT-SWR');
        reply.send(cachedBuffer);

        // Background Update (if not locked)
        const isLocked = await redis.exists(lockKey);
        if (!isLocked) {
            // Set Lock to prevent thundering herd on background update
            await redis.set(lockKey, '1', 'EX', LOCK_TTL, 'NX');
            // Fire & Forget
            // Fire & Forget - Use setTimeout to ensure response is efficiently flushed on the network layer
            // This 500ms delay helps prevents CPU starvation from the background process affecting the current response closure
            const freshKey = `fresh:${cacheKey}`;
            const isFresh = await redis.exists(freshKey);

            if (isFresh) {
                console.log(`[OG] SWR Cache HIT-FRESH (Window: 60s). Skipping background update.`);
            } else {
                console.log(`[OG] SWR Cache HIT-STALE. Response Sent. Scheduling background update...`);
                setTimeout(() => {
                    console.log(`[OG] SWR: Starting background update for ${pinId}`);
                    // Set fresh key immediately to prevent overlapped triggers in the same window
                    redis.set(freshKey, '1', 'EX', REVALIDATE_TTL);

                    generateOgImage(pinId, queryParams, authorizedBundle, cacheKey)
                        .then(() => redis.del(lockKey))
                        .catch(e => {
                            console.error("[OG] Background SWR Failed:", e);
                            redis.del(lockKey);
                            redis.del(freshKey); // Retry next time
                        });
                }, 500);
            }
        }
        return;
    }

    // Miss? - Synchronous Generation
    try {
        const acquired = await redis.set(lockKey, '1', 'EX', LOCK_TTL, 'NX');
        if (!acquired) {
            // Wait for other process
            let retries = 20; // 10s total
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

        const freshBuffer = await generateOgImage(pinId, queryParams, authorizedBundle, cacheKey);
        await redis.del(lockKey);

        reply.header('Content-Type', 'image/png');
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
});

// Health
server.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
    try {
        await server.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`Server listening on port ${PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
