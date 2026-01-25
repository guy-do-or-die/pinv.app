import { config } from "./config.js";

const PRIVATE_RANGES = [
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^0\./,
    /^169\.254\./,
    /^::1$/,
    /^f[cd][0-9a-f]{2}:/i,
    /^fe80:/i,
];

const ALLOWED_PROTOCOLS = ["http:", "https:"];

export function isPrivateIP(ip: string): boolean {
    return PRIVATE_RANGES.some(r => r.test(ip));
}

import dns from "node:dns/promises";

export async function validateUrl(urlStr: string): Promise<string | null> {
    if (!config.denyPrivateNetworks) return null;

    try {
        const url = new URL(urlStr);
        if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
            return `Protocol ${url.protocol} not allowed.`;
        }

        const hostname = url.hostname;

        // Block localhost explicit
        if (hostname === "localhost" || hostname.endsWith(".local")) {
            return "Localhost access denied.";
        }

        // 1. Check if it's an IP literal immediately
        if (isPrivateIP(hostname)) return "Private IP range denied.";

        // 2. Resolve DNS (A/AAAA) to check against private ranges
        // Note: This does not prevent DNS rebinding *after* this check, but blocks private records.
        // For fetch, rebinding is still a risk unless the agent is pinned.
        // But for this hardening step, we ensure the hostname doesn't resolve to internal IPs.
        if (!/^[\d.]+$/.test(hostname) && !hostname.includes(":")) {
            try {
                // dns.lookup is what node uses, but it respects hosts file etc.
                const lookupRes = await dns.lookup(hostname, { all: true, family: 0 });
                for (const addr of lookupRes) {
                    if (isPrivateIP(addr.address)) return `Resolved private IP ${addr.address} denied.`;
                }
            } catch (e: any) {
                // Fail Closed on DNS Error
                return `DNS Resolution Failed: ${e.message}`;
            }
        }

        return null; // OK
    } catch (e) {
        return "Invalid URL";
    }
}
