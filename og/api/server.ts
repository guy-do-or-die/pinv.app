import fastify from 'fastify';
import cors from '@fastify/cors';
import { PORT, CHAIN_ID, CONTRACT_ADDRESS } from '../utils/constants';
import { env } from '../utils/env';
import { logEnv } from '@/lib/env-logger';

import { previewHandler, getPinHandler } from './controllers';

import { logToFile } from '../utils/logger';


logEnv(env, "OG SERVICE");

const server = fastify({
    logger: true,
    disableRequestLogging: false
});

// ... (middleware)

// PREVENTION: Concurrency Limiter
// 1GB RAM / ~100MB per heavy render = ~10 concurrent requests safe limit.
const MAX_CONCURRENT = 10;
let activeRequests = 0;

server.addHook('onRequest', async (req, reply) => {
    if (activeRequests >= MAX_CONCURRENT) {
        // Fast fail to protect memory
        logToFile(`[Load Shedding] Rejecting request. Active: ${activeRequests}`);
        return reply.status(503).header('Retry-After', '5').send('Server Busy - Too High Load');
    }
    activeRequests++;
});

server.addHook('onResponse', async (req, reply) => {
    activeRequests--;
});

// Global Handlers
process.on('unhandledRejection', (reason, promise) => {
    const msg = `[OG Engine] Unhandled Rejection: ${reason}`;
    console.error(msg);
    logToFile(msg);
});

process.on('uncaughtException', (err) => {
    const msg = `[OG Engine] Uncaught Exception: ${err.message}`;
    console.error(msg);
    logToFile(msg);
});

const start = async () => {
    try {
        await server.listen({ port: PORT, host: '0.0.0.0' });
        const msg = `Server listening on port ${PORT} | IPFS: ${env.NEXT_PUBLIC_IPFS_GATEWAY}`;
        console.log(msg);
        logToFile(msg);
    } catch (err) {
        server.log.error(err);
        logToFile(`Server Startup Failed: ${err}`);
        process.exit(1);
    }
};

server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
});

// Endpoint for Unified Preview (Executes Data Code + Renders Image)
server.post('/og/preview', previewHandler);

// OG Route
server.get<{
    Params: { pinId: string }, Querystring: {
        t: any; b?: string, sig?: string, params?: string, ver?: string, ts?: string, tokenId?: string
    }
}>('/og/:pinId', getPinHandler);

// Health
server.get('/health', async () => ({ status: 'ok' }));

console.log(`[OG Engine] Starting on Port: ${PORT}`);
console.log(`[OG Engine] Chain ID: ${CHAIN_ID}`);
console.log(`[OG Engine] Contract Address: ${CONTRACT_ADDRESS}`);
console.log(`[OG Engine] IPFS Gateway: ${env.NEXT_PUBLIC_IPFS_GATEWAY}`);
console.log('------------------------------------------------');

start();
