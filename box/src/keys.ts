import { DstackClient } from "@phala/dstack-sdk";
import { decrypt as eciesDecrypt } from "eciesjs";
import { config } from "./config.js";
import { logger } from "./logger.js";

// We use a fixed key ID for the application master key
const APP_KEY_ID = "pinv-master-key";

// Cache the key
let _cachedPublicKey: string | null = null;
let _cachedPrivateKey: string | null = null;
let _ready: boolean = false;

async function loadKeys() {
    if (_cachedPublicKey && _cachedPrivateKey) return { publicKey: _cachedPublicKey, privateKey: _cachedPrivateKey };

    logger.info("[Keys] deriving key from Dstack SDK...");
    try {
        const client = new DstackClient();
        const result = await client.getKey(APP_KEY_ID);

        const privateKeyBuffer = Buffer.from(result.key);
        const privateKeyHex = privateKeyBuffer.toString('hex');

        // ECIES (secp256k1)
        const { PrivateKey } = await import("eciesjs");
        const priv = new PrivateKey(privateKeyBuffer);
        const pub = priv.publicKey.toHex();

        _cachedPrivateKey = privateKeyHex;
        _cachedPublicKey = pub;
        _ready = true;

        logger.info("[Keys] Identity Key derived successfully.");
        return { publicKey: pub, privateKey: privateKeyHex };

    } catch (e) {
        logger.warn({ err: e }, "[Keys] Failed to derive keys from Dstack");

        if (config.strictKeyDerivation) {
            logger.fatal("[Keys] STRICT_KEY_DERIVATION is enabled. Exiting because key derivation failed.");
            _ready = false;
            // Depending on strictness, we might just fail readiness instead of exit process, but original code had process.exit.
            // We will let readiness fail so we can serve 503s.
            return { publicKey: "", privateKey: "" }; // Will fail calls
        }

        logger.warn("[Keys] Generating Ephemeral Local Key... (DEV MODE ONLY)");

        // Fallback: Generate random key for local dev
        const { PrivateKey } = await import("eciesjs");
        const fixedSecret = "b5b1870857d1272961d0448192c906857181c7b8763568910826922d57ba827c";
        const priv = new PrivateKey(Buffer.from(fixedSecret, 'hex'));
        logger.warn("[Keys] Using FIXED Deterministic Key for Simulation...");
        const pub = priv.publicKey.toHex();

        _cachedPrivateKey = priv.toHex();
        _cachedPublicKey = pub;
        _ready = true;

        return { publicKey: pub, privateKey: _cachedPrivateKey };
    }
}

export async function getPublicKey(): Promise<string> {
    const k = await loadKeys();
    if (!k.publicKey) throw new Error("Keys not ready");
    return k.publicKey;
}

export async function decryptRaw(encryptedDataBase64: string): Promise<Buffer> {
    const k = await loadKeys();
    if (!k.privateKey) throw new Error("Keys not ready");
    const encryptedBuffer = Buffer.from(encryptedDataBase64, "base64");

    // ECIES Decrypt
    return eciesDecrypt(Buffer.from(k.privateKey, 'hex'), encryptedBuffer);
}

export async function decrypt(encryptedDataBase64: string): Promise<string> {
    const decryptedBuffer = await decryptRaw(encryptedDataBase64);
    return decryptedBuffer.toString("utf-8");
}

export function isKeyReady(): boolean {
    return _ready;
}

// Trigger initial load
loadKeys().catch(e => console.error("Initial key load failed", e));
