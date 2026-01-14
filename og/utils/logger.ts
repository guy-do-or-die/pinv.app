import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, '../debug.log');

import { env } from './env';

export function logToFile(msg: string) {
    // Only log to file in production/staging to avoid clutter in dev
    if (env.NODE_ENV === 'production') {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] ${msg}\n`;
        fs.appendFile(LOG_FILE, logLine, (err) => {
            if (err) console.error('Failed to write to log file:', err);
        });
    }
}
