import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { APP_URL, WORKER_TIMEOUT_MS } from '../utils/constants';

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

// Helper: Render Image in Worker
export async function renderImageInWorker(uiCode: string, props: { [key: string]: any }, width: number, height: number): Promise<Buffer> {
    const workerCmd = path.join(__dirname, '../worker.js'); // Adjusted path: now in lib/, worker is in ../
    const tSpawnStart = performance.now();
    const child = spawn('bun', [workerCmd], { stdio: ['pipe', 'pipe', 'pipe'] });

    const inputPayload = JSON.stringify({
        uiCode,
        props,
        width,
        height,
        baseUrl: APP_URL
    });

    child.stdin.write(inputPayload);
    child.stdin.end();

    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];
    child.stdout.on('data', c => chunks.push(c));
    child.stderr.on('data', c => errChunks.push(c));

    const exitCode = await new Promise<number | null>(resolve => {
        child.on('close', resolve);
        setTimeout(() => { child.kill('SIGKILL'); resolve(-1); }, WORKER_TIMEOUT_MS);
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

    return pngBuffer;
}
