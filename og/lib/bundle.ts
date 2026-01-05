import { canonicalizeParams, NormalizedParams, Bundle } from '../../lib/og-common';

// Bundle is now imported from params (which exports * from og-common)

// Re-export Bundle if needed, but here we use it.
const MAX_BUNDLE_SIZE = 8192; // 8KB limit for bundle

export function parseBundle(b64url: string): Bundle | null {
    try {
        if (!b64url || b64url.length > MAX_BUNDLE_SIZE) return null;

        const jsonStr = Buffer.from(b64url, 'base64url').toString();
        const raw = JSON.parse(jsonStr);

        if (typeof raw !== 'object' || raw === null) return null;

        const bundle: Bundle = {};

        // ver
        if (raw.ver && typeof raw.ver === 'string') {
            // Basic CID check? (Starts with Qm or bafy...)
            if (raw.ver.length < 100) bundle.ver = raw.ver;
        }

        // params
        if (raw.params && typeof raw.params === 'object') {
            bundle.params = canonicalizeParams(raw.params);
        } else {
            bundle.params = {};
        }

        // ts
        if (typeof raw.ts === 'number') {
            bundle.ts = raw.ts;
        }

        return bundle;

    } catch (e) {
        return null; // Safe fail
    }
}
