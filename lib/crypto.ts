import { encrypt } from "eciesjs";
import { Buffer } from "buffer";

// Interface for the Envelope Structure
export interface EncryptedEnvelope {
    capsules: {
        box?: string;   // ECIES Encrypted Session Key
        owner?: string; // AES Encrypted Session Key (using Signature)
    };
    iv?: string;        // Base structure IV (unused if per-param)
    data: Record<string, { ciphertext: string; iv: string }>;
    code?: { ciphertext: string; iv: string };
}

/**
 * Generate a random 256-bit AES-GCM key.
 */
export async function generateSessionKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    );
}

/**
 * Import a raw key (e.g. from unwrapping).
 */
export async function importSessionKey(rawKey: BufferSource): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw",
        rawKey,
        "AES-GCM",
        true,
        ["encrypt", "decrypt"]
    );
}

/**
 * Export key to raw bytes (for wrapping).
 */
export async function exportSessionKey(key: CryptoKey): Promise<ArrayBuffer> {
    return crypto.subtle.exportKey("raw", key);
}

/**
 * Encrypt data using AES-GCM with the session key.
 * Returns { ciphertext, iv } as Base64 strings.
 */
export async function encryptData(data: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const encoded = new TextEncoder().encode(data);

    const ciphertext = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encoded
    );

    return {
        ciphertext: Buffer.from(ciphertext).toString("base64"),
        iv: Buffer.from(iv).toString("base64"),
    };
}

/**
 * Decrypt data using AES-GCM.
 */
export async function decryptData(
    ciphertextB64: string,
    ivB64: string,
    key: CryptoKey
): Promise<string> {
    const ciphertext = Buffer.from(ciphertextB64, "base64");
    const iv = Buffer.from(ivB64, "base64");

    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

/**
 * Wrap Session Key for Box (ECIES).
 */
export async function wrapKeyForBox(sessionKey: CryptoKey, boxPublicKeyHex: string): Promise<string> {
    const rawKey = await exportSessionKey(sessionKey);
    const buffer = Buffer.from(rawKey);
    // ECIES Encrypt the raw key bytes
    const encrypted = encrypt(boxPublicKeyHex, buffer);
    return encrypted.toString("base64");
}

/**
 * Wrap Session Key for Owner (AES-GCM).
 * Key is derived from Wallet Signature (SHA-256 hash of signature).
 */
export async function wrapKeyForOwner(sessionKey: CryptoKey, signature: string): Promise<string> {
    // 1. Derive Wrapping Key from Signature
    const sigHash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(signature)
    );

    // Import as AES-KW or AES-GCM Key. Using AES-GCM for simplicity and auth tag.
    const wrappingKey = await crypto.subtle.importKey(
        "raw",
        sigHash,
        "AES-GCM",
        false,
        ["encrypt", "wrapKey"]
    );

    // 2. Wrap (Encrypt) the Session Key
    // We could use wrapKey API, or just export + encrypt. 
    // export+encrypt allows us to use standard AES-GCM structure (IV).
    const rawSessionKey = await exportSessionKey(sessionKey);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const wrapped = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        wrappingKey,
        rawSessionKey
    );

    // Return as combined string IV:Ciphertext for simplicity?
    // Or just Base64 IV + Ciphertext.
    // Let's pack them: "iv:ciphertext"
    const ivStr = Buffer.from(iv).toString("base64");
    const cipherStr = Buffer.from(wrapped).toString("base64");
    return `${ivStr}:${cipherStr}`;
}

/**
 * Unwrap Session Key for Owner.
 */
export async function unwrapKeyForOwner(wrappedBlob: string, signature: string): Promise<CryptoKey> {
    const [ivB64, cipherB64] = wrappedBlob.split(":");
    if (!ivB64 || !cipherB64) throw new Error("Invalid wrapped key format");

    // 1. Derive Unwrapping Key
    const sigHash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(signature)
    );
    const unwrappingKey = await crypto.subtle.importKey(
        "raw",
        sigHash,
        "AES-GCM",
        false,
        ["decrypt", "unwrapKey"]
    );

    // 2. Decrypt
    const iv = Buffer.from(ivB64, "base64");
    const ciphertext = Buffer.from(cipherB64, "base64");

    const rawSessionKey = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        unwrappingKey,
        ciphertext
    );

    // 3. Import Session Key
    return importSessionKey(rawSessionKey);
}
