import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        PINATA_JWT: z.string().min(1),
        LLM_MODEL: z.string().optional().default("anthropic/claude-3.5-sonnet"),
        OPENROUTER_API_KEY: z.string().optional(),
        BASE_URL: z.url().optional().default("http://localhost:3000"),
        CI: z.string().optional(), // Often usually a string "true" in CI envs, or could be boolean if using dotenv parse
    },
    client: {
        NEXT_PUBLIC_CHAIN_ID: z.coerce.number().int().optional().default(84532), // "8453"
        NEXT_PUBLIC_CHAIN: z.enum(["test", "mainnet"]).optional().default("test"),
        NEXT_PUBLIC_ONCHAINKIT_API_KEY: z.string().optional(),
        NEXT_PUBLIC_OG_ENGINE_URL: z.url().optional().default("http://localhost:8080"),
        NEXT_PUBLIC_IPFS_GATEWAY: z.url().optional().default("https://ipfs.io"),
        NEXT_PUBLIC_APP_URL: z.url().optional().default("http://localhost:3000"),
        NEXT_PUBLIC_PINV_ADDRESS: z.string().startsWith("0x").optional(),
        NEXT_PUBLIC_PINV_ADDRESS_BASE_SEPOLIA: z.string().startsWith("0x").optional(),
    },
    runtimeEnv: {
        PINATA_JWT: process.env.PINATA_JWT,
        LLM_MODEL: process.env.LLM_MODEL,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
        BASE_URL: process.env.BASE_URL,
        CI: process.env.CI,
        NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
        NEXT_PUBLIC_CHAIN: process.env.NEXT_PUBLIC_CHAIN,
        NEXT_PUBLIC_ONCHAINKIT_API_KEY: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
        NEXT_PUBLIC_OG_ENGINE_URL: process.env.NEXT_PUBLIC_OG_ENGINE_URL,
        NEXT_PUBLIC_IPFS_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_PINV_ADDRESS: process.env.NEXT_PUBLIC_PINV_ADDRESS,
        NEXT_PUBLIC_PINV_ADDRESS_BASE_SEPOLIA: process.env.NEXT_PUBLIC_PINV_ADDRESS_BASE_SEPOLIA,
    },
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
    emptyStringAsUndefined: true,
});
