import { NEXT_PUBLIC_APP_URL } from "@/lib/config";

/**
 * Preview service - centralized URL building and preview utilities.
 * Follows Single Responsibility: only handles preview-related URL construction.
 */

/**
 * Build an OG image URL for a pin with given parameters.
 */
import { Pin } from "@/types";

/**
 * Build an OG image URL for a pin with given parameters.
 */
export function buildOgUrl(pinId: number | string, params: Record<string, string> = {}, bustCache = true, pin?: Pin): string {
    // 1. SAME DOMAIN ACCESS
    // Use the main application URL. Next.js Rewrites (or Prod Ingress) will route /og/* to the Engine.
    const appUrl = NEXT_PUBLIC_APP_URL;
    const url = new URL(`${appUrl}/og/${pinId}`);

    // OPTIMIZATION: Use signed bundle if available (Client-Side Generation)
    // DISABLED per user request for "No Security/Smooth UX" and to fix caching issues.
    // We now force a dynamic server request with cache busting.

    /* 
    if (pin?.version && pin.widget?.signature && pin.widget?.timestamp) {
        if (Object.keys(params).length === 0) {
            const bundle = {
                ver: pin.version,
                params: pin.widget.previewData || {},
                ts: pin.widget.timestamp
            };
            const encodedBundle = encodeBundle(bundle);
            url.searchParams.set('b', encodedBundle);
            url.searchParams.set('sig', pin.widget.signature);
            bustCache = false;
        }
    }
    */

    if (bustCache) {
        url.searchParams.set('t', Date.now().toString());
    }

    if (pin?.version) {
        url.searchParams.set('ver', pin.version);
    }

    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
    });

    return url.toString();
}

/**
 * Build a shareable URL for a pin with given parameters.
 */
export function buildShareUrl(pinId: number | string, params: Record<string, string> = {}): string {
    const appUrl = NEXT_PUBLIC_APP_URL;
    const url = new URL(`${appUrl}/p/${pinId}`);

    Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
    });

    return url.toString();
}

/**
 * Build a pin page URL.
 */
export function buildPinUrl(pinId: number | string): string {
    return `${NEXT_PUBLIC_APP_URL}/p/${pinId}`;
}

/**
 * Build a pin edit URL.
 */
export function buildEditUrl(pinId: number | string): string {
    return `${NEXT_PUBLIC_APP_URL}/p/${pinId}/edit`;
}
