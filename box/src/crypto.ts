import { decryptRaw } from "./keys.js";

import type { EncryptedEnvelope } from "../../lib/crypto.js";
import { decryptData, importSessionKey } from "../../lib/crypto.js";

/**
 * Attempt to unwrap and decrypt an envelope.
 * Returns undefined if format doesn't match, throws if decryption fails.
 */
export async function tryUnwrapEnvelope(envelopeStr: string): Promise<{ params: Record<string, any>; code?: string } | undefined> {
    let envelope: EncryptedEnvelope;
    try {
        envelope = JSON.parse(envelopeStr);
    } catch {
        return undefined; // Not JSON -> Legacy Mode
    }

    if (!envelope.capsules?.box || (!envelope.data && !envelope.code)) {
        return undefined; // Doesn't match schema -> Legacy Mode
    }

    // 1. Unwrap Session Key (Box Capsule) using ECIES
    // The capsule contains the RAW AES-256 Key encrypted with ECIES.
    const rawKeyBuffer = await decryptRaw(envelope.capsules.box);

    // Import as CryptoKey
    const sessionKey = await importSessionKey(new Uint8Array(rawKeyBuffer));

    // 2. Decrypt ALL data using Session Key (AES-GCM)
    const result: { params: Record<string, any>; code?: string } = { params: {} };

    // Decrypt Params
    if (envelope.data) {
        for (const [key, encData] of Object.entries(envelope.data)) {
            if (!encData.ciphertext || !encData.iv) continue;

            try {
                result.params[key] = await decryptData(
                    encData.ciphertext,
                    encData.iv,
                    sessionKey
                );
            } catch (e) {
                console.error(`[Box] Decryption failed for param ${key}:`, e);
                throw new Error(`Failed to decrypt param ${key}`);
            }
        }
    }

    // Decrypt Code
    if (envelope.code) {
        try {
            result.code = await decryptData(
                envelope.code.ciphertext,
                envelope.code.iv,
                sessionKey
            );
        } catch (e) {
            console.error(`[Box] Code Decryption failed:`, e);
            throw new Error(`Failed to decrypt code`);
        }
    }

    return result;
}
