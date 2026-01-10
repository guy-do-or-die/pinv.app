import fastify from 'fastify';
import cors from '@fastify/cors';
import { PORT, CHAIN_ID, CONTRACT_ADDRESS } from '../utils/constants';
import { previewHandler, getPinHandler } from './controllers';

const server = fastify({
    logger: true,
    disableRequestLogging: false
});

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

console.log('------------------------------------------------');
console.log(`[OG Engine] Starting on Port: ${PORT}`);
console.log(`[OG Engine] Chain ID: ${CHAIN_ID}`);
console.log(`[OG Engine] Contract Address: ${CONTRACT_ADDRESS}`);
console.log('------------------------------------------------');

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
