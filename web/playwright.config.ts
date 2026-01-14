import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';
import { env } from './env';

// Load env
dotenv.config({ path: path.join(__dirname, '.env.local') });

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    forbidOnly: !!env.CI,
    retries: env.CI ? 2 : 0,
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: env.BASE_URL,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
