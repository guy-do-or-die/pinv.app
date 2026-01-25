import { encrypt } from "eciesjs";

// Note: Ensure Buffer is available in the browser (likely need polyfill for Next.js)
import { Buffer } from "buffer";

/**
 * Box Client - Handles encryption and interaction with the Box Runtime (Phala TEE).
 */

export async function fetchBoxPublicKey(): Promise<string> {
    const key = process.env.NEXT_PUBLIC_BOX_PUBLIC_KEY;
    if (!key) {
        console.warn("NEXT_PUBLIC_BOX_PUBLIC_KEY is not defined. Encryption will fail.");
        throw new Error("Missing NEXT_PUBLIC_BOX_PUBLIC_KEY");
    }
    return key;
}

export async function encryptWithBoxKey(data: string, publicKeyHex: string): Promise<string> {
    // ECIES Encrypt
    // input: data (string), publicKey (hex string)
    // output: base64 string

    try {
        const encryptedBuffer = encrypt(publicKeyHex, Buffer.from(data));
        return encryptedBuffer.toString("base64");
    } catch (e) {
        console.error("Encryption Failed:", e);
        throw e;
    }
}
