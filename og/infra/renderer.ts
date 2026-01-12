import path from 'path';
import fs from 'fs';
import { APP_URL } from '../utils/constants';
import { BunWorkerPool } from './pool';

// Native Bun Worker Pool
// Limit maxWorkers to avoid OOM on small instances (Fly.io).
const MAX_WORKERS = parseInt(process.env.OG_MAX_THREADS || '2');
const workerPath = path.join(__dirname, '../worker.js');

// Ensure worker exists
if (!fs.existsSync(workerPath)) {
    console.error('[OG] Worker file missing:', workerPath);
}

const pool = new BunWorkerPool(workerPath, {
    maxWorkers: MAX_WORKERS,
    executionTimeout: 15000 // 15s timeout
});

console.log(`[Renderer] Initialized Native Worker Pool (Max Workers: ${MAX_WORKERS})`);

// Helper: Stub Image
export function getStubImage(text: string): Buffer {
    try {
        const prodPath = '/app/public/hero.png';
        const devPath = path.join(__dirname, '../../public/hero.png');
        const imagePath = fs.existsSync(prodPath) ? prodPath : devPath;
        if (fs.existsSync(imagePath)) return fs.readFileSync(imagePath);
    } catch (e) { }
    return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');
}

// Helper: Render Image (Worker Pool)
export async function renderImageInWorker(uiCode: string, props: { [key: string]: any }, width: number, height: number): Promise<Buffer> {
    const tStart = performance.now();

    try {
        const result = await pool.execute({
            uiCode,
            props,
            width,
            height,
            baseUrl: APP_URL
        });

        console.log(`[Perf] Render (Worker Pool): ${(performance.now() - tStart).toFixed(2)}ms`);
        return result;
    } catch (e) {
        console.error(`[Renderer] Render Failed:`, e);
        throw new Error('RENDER_FAILED');
    }
}
