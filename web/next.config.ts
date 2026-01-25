import type { NextConfig } from "next";
import path from "path";

import { env } from "./env";

const cspConfig = {
  "default-src": ["'self'"],
  // 'unsafe-eval' is often required by Web3 libraries.
  // 'unsafe-inline' is used for Next.js inline scripts/styles (unless nonces are strictly configured).
  "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": [
    "'self'",
    "blob:",
    "data:",
    "https:",
    "http://localhost:8080",
    "https://pinv-og.fly.dev",
  ],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    "https:",
    "https://explorer-api.walletconnect.com",
    "https://farcaster.xyz",
    "https://client.farcaster.xyz",
    "https://warpcast.com",
    "https://client.warpcast.com",
    "https://wrpcd.net",
    "https://*.wrpcd.net",
    "https://privy.farcaster.xyz",
    "https://privy.warpcast.com",
    "https://auth.privy.io",
    "https://*.rpc.privy.systems",
    "https://cloudflareinsights.com",
    "https://cors.lol",
    "https://api.openweathermap.org",
    "https://sepolia.base.org",
    "https://mainnet.base.org",
    "https://uploads.pinata.cloud",
    "https://*.pinata.cloud",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3333",
    "http://localhost:4444",
    "http://localhost:5555",
    "https://pinv-og.fly.dev",
    "https://pinv-og-staging.fly.dev",
    "https://ipfs.io",
    "https://*.ipfs.io",
    "https://dweb.link",
    "https://*.dweb.link",
    "https://*.ipfs.dweb.link",
    "https://*.ipfs.dweb.link",
    "https://green-impossible-swordfish-523.mypinata.cloud",
  ],
};

const cspHeader = Object.entries(cspConfig)
  .map(([key, values]) => `${key} ${values.join(" ")}`)
  .join("; ");

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "thread-stream"],
  // Note: 'turbopack' key is stable in Next.js 15+, checking documentation validity.
  // The error message explicitely mentioned setting turbopack.root.
  turbopack: {
    root: path.join(__dirname, '..'),
  },
  allowedDevOrigins: ["welcome-primate-specially.ngrok-free.app", "pinv.app", "localhost:3000"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/og/:path*",
        destination: `${env.NEXT_PUBLIC_OG_ENGINE_URL}/og/:path*`,
      },
    ];
  },
};

export default nextConfig;
