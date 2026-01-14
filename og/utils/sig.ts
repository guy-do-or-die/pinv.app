import { Hex, keccak256, toBytes } from 'viem';
import { pinVConfig } from './contracts';
import { env } from './env';

import { Bundle, computeParamsHash } from '../../lib/og-common';

const SIGNED_TS_MAX_AGE_SEC = env.SIGNED_TS_MAX_AGE_SEC;
const SIGNED_TS_FUTURE_SKEW_SEC = env.SIGNED_TS_FUTURE_SKEW_SEC;

// Use contract address as verifying contract
const CHAIN_ID = env.NEXT_PUBLIC_CHAIN_ID as 8453 | 84532 | 31337;
const CONTRACT_ADDRESS = pinVConfig.address[CHAIN_ID] as `0x${string}`;

const domain = {
    name: 'PinV',
    version: '1',
    chainId: CHAIN_ID,
    verifyingContract: CONTRACT_ADDRESS
} as const;

const types = {
    PinConfiguration: [
        { name: 'Pin_ID', type: 'uint256' },
        { name: 'Content_CID', type: 'string' },
        { name: 'Configuration_Hash', type: 'bytes32' },
        { name: 'Timestamp', type: 'uint256' }
    ]
} as const;

export async function verifySignature(
    pinId: number,
    bundle: Bundle,
    signature: string
): Promise<string | null> {
    // 1. Check timestamp validity first
    if (!bundle.ts) {
        console.log('[Sig] Missing TS');
        return null;
    }

    const now = Math.floor(Date.now() / 1000);
    console.log(`[Sig] TS Check: Bundle=${bundle.ts}, Now=${now}, Diff=${now - bundle.ts}`);

    if (now - bundle.ts > SIGNED_TS_MAX_AGE_SEC) {
        console.log('[Sig] TS Too Old');
        return null;
    }
    if (bundle.ts - now > SIGNED_TS_FUTURE_SKEW_SEC) {
        console.log('[Sig] TS Future Skew');
        return null;
    }

    // 2. Prepare Message
    const paramsStr = computeParamsHash(bundle.params || {});
    // Hash the params string to bytes32
    const paramsHash = keccak256(toBytes(paramsStr));

    const message = {
        Pin_ID: BigInt(pinId),
        Content_CID: bundle.ver || '',
        Configuration_Hash: paramsHash,
        Timestamp: BigInt(bundle.ts)
    };

    try {
        // 3. Verify & Recover
        // We need to recover the address.
        const { recoverTypedDataAddress } = await import('viem');

        const recovered = await recoverTypedDataAddress({
            domain,
            types,
            primaryType: 'PinConfiguration',
            message,
            signature: signature as Hex
        });

        console.log(`[Sig] Recovered: ${recovered}`);

        return recovered; // Returns the signer address (0x...)

    } catch (e) {
        console.error('Sig verification error:', e);
        return null;
    }
}
