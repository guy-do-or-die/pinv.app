import { keccak256, toBytes, Hex } from 'viem';
import { WalletClient } from 'viem';
import { pinVConfig } from '@/hooks/contracts';
import { NormalizedParams, Bundle, canonicalizeParams, computeParamsHash } from './og-common';

export type { NormalizedParams, Bundle };
export { canonicalizeParams, computeParamsHash };

// Signing Helper
export async function signBundle(
    walletClient: WalletClient,
    account: Hex, // address
    pinId: number,
    bundle: Bundle,
    chainId: number
): Promise<string> {
    if (!bundle.ts) throw new Error("Bundle must have a timestamp");

    // Canonicalize params (ensure all values are strings) to match Server behavior
    const normalizedParams = canonicalizeParams(bundle.params || {});
    const paramsStr = computeParamsHash(normalizedParams);
    const paramsHash = keccak256(toBytes(paramsStr));

    const domain = {
        name: 'PinV',
        version: '1',
        chainId: chainId,
        verifyingContract: (pinVConfig.address as any)[chainId] as Hex
    } as const;

    const types = {
        CustomizeOG: [
            { name: 'pinId', type: 'uint256' },
            { name: 'ver', type: 'string' },
            { name: 'paramsHash', type: 'bytes32' },
            { name: 'ts', type: 'uint256' }
        ]
    } as const;

    const message = {
        pinId: BigInt(pinId),
        ver: bundle.ver || '',
        paramsHash: paramsHash,
        ts: BigInt(bundle.ts)
    };

    const signature = await walletClient.signTypedData({
        account,
        domain,
        types,
        primaryType: 'CustomizeOG',
        message
    });

    return signature;
}

// Browser-safe base64url encoding
// Browser-safe base64url encoding that handles Unicode/Emoji
export function encodeBundle(bundle: Bundle): string {
    const jsonStr = JSON.stringify(bundle);
    const bytes = new TextEncoder().encode(jsonStr);
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    const base64 = btoa(binString);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBundle(encoded: string): Bundle | null {
    try {
        const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        const padding = base64.length % 4;
        const paddedIdx = padding ? base64 + '='.repeat(4 - padding) : base64;

        const binString = atob(paddedIdx);
        const bytes = Uint8Array.from(binString, (c) => c.charCodeAt(0));
        const jsonStr = new TextDecoder().decode(bytes);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to decode bundle", e);
        return null;
    }
}
