import { CID } from 'multiformats/cid';

/**
 * CID Utility Library
 * Abstracts away the complexity of Request/Response CID versions.
 * 
 * Strategy:
 * - Internal & Storage: Prefer CIDv1 (canonical).
 * - Lit Protocol: Enforce CIDv0 (legacy compatibility).
 */

export function toV0(cidStr: string): string {
    try {
        const c = CID.parse(cidStr);
        return c.toV0().toString();
    } catch (e) {
        // If it can't be converted (e.g. Raw codec cannot be v0), return original
        console.warn(`CID ${cidStr} cannot be converted to v0`, e);
        return cidStr;
    }
}

export function toV1(cidStr: string): string {
    try {
        const c = CID.parse(cidStr);
        return c.toV1().toString();
    } catch (e) {
        return cidStr;
    }
}

export function isV0(cidStr: string): boolean {
    try {
        const c = CID.parse(cidStr);
        return c.version === 0;
    } catch (e) {
        return false;
    }
}

/**
 * Ensures compatibility with Lit Protocol.
 * Lit Nodes (currently) validate content using DAG-PB / CIDv0.
 */
export function ensureLitCompatibleCid(cidStr: string): string {
    // If it's already v0, great.
    if (isV0(cidStr)) return cidStr;

    // Try to convert to v0
    return toV0(cidStr);
}
