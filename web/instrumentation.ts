import { env } from './env';
import { logEnv } from '@/lib/env-logger';

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        logEnv(env, "WEB SERVICE");
    }
}
