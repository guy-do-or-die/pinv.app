import path from 'path';
import * as dotenv from 'dotenv';
import { pinVAddress } from './contracts';

// Load env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local'), override: true });

export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const CACHE_TTL = 604800; // 7 days (Long-term storage)
export const REVALIDATE_TTL = 60; // 1 minute (Freshness check for dynamic content)
export const LOCK_TTL = 30; // 30s lock for generation
export const PORT = parseInt(process.env.PORT || '8080');
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532') as 8453 | 84532;
export const CONTRACT_ADDRESS = pinVAddress[CHAIN_ID] || pinVAddress[84532];
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 800;
export const WORKER_TIMEOUT_MS = 10000;
export const MEMORY_CACHE_TTL = 60000;

