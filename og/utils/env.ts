import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


export const env = createEnv({
    server: {
        PORT: z.coerce.number().default(8080),
        NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
        REDIS_URL: z.string().url().default("redis://localhost:6379"),
        OG_MAX_THREADS: z.coerce.number().default(2),

        // Integrations
        RPC_URL: z.string().url().optional(),
        PRIORITY_GATEWAY: z.string().url().optional(),
        NEXT_PUBLIC_IPFS_GATEWAY: z.string().url().optional().default("https://ipfs.io"),


        // Shared / Public (validated as server vars here since it's a node app)
        NEXT_PUBLIC_CHAIN_ID: z.coerce.number().int().default(84532),
        NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
        CONTRACT_ADDRESS: z.string().startsWith("0x").optional(),
        NEXT_PUBLIC_PINV_ADDRESS_BASE_MAINNET: z.string().startsWith("0x").optional().default("0x0000000000000000000000000000000000000000"),
        NEXT_PUBLIC_PINV_ADDRESS_BASE_SEPOLIA: z.string().startsWith("0x").optional().default("0xfB5118bcAec3b6D774307E777679C7Bc16dcE020"),

        // Security
        SIGNED_TS_MAX_AGE_SEC: z.coerce.number().default(86400),
        SIGNED_TS_FUTURE_SKEW_SEC: z.coerce.number().default(600),
        INTERNAL_AUTH_KEY: z.string().min(1).optional(),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});

