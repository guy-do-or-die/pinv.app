import { getPin } from '../infra/pin';
import { executeBoxAction } from '../infra/box';
import { renderImageInWorker } from '../infra/renderer';
import { redis, memoryCache } from '../infra/cache';
import { CACHE_TTL, REVALIDATE_TTL, OG_WIDTH, OG_HEIGHT, MEMORY_CACHE_TTL } from '../utils/constants';

// Internal Generation Function (Decoupled from Request)
export async function generateOgImage(pinId: number, queryParams: Record<string, string>, authorizedBundle: any, cacheKey: string, preFetchedPin?: any): Promise<Buffer> {
    const t0 = performance.now();
    let pin = preFetchedPin;

    // 1. Fetch Pin (if not provided)
    if (!pin) {
        if (pinId === 0) {
            pin = {
                id: 0,
                title: "Preview",
                tokenURI: "",
                widget: { uiCode: "", previewData: {}, userConfig: {} }
            };
        } else {
            // FIX: If bundle specifies a version, fetch THAT version, not latest.
            const targetVer = authorizedBundle?.ver ? BigInt(authorizedBundle.ver) : undefined;
            pin = await getPin(pinId, targetVer);
        }
    }
    const tPinFetch = performance.now();
    console.log(`[Perf] Pin Fetch: ${(tPinFetch - t0).toFixed(2)}ms`);

    if (!pin) {
        throw new Error('PIN_NOT_FOUND');
    }

    let uiCode = pin.widget?.uiCode;
    let baseProps = {
        ...(pin.widget?.previewData || {}),
        ...(pin.widget?.userConfig || {}),
    };

    // 2. Extract Defaults
    // Use previewData as the source of truth for defaults (includes secrets)
    const defaultParams: Record<string, any> = { ...pin.widget?.previewData };

    // 3. Apply Overrides / Bundle
    const overrides: Record<string, string> = {};
    const reservedKeys = ['b', 'sig', 'ver', 'ts', 'tokenId', 't'];
    Object.keys(queryParams).forEach(key => {
        if (!reservedKeys.includes(key)) overrides[key] = queryParams[key];
    });

    if (authorizedBundle) {
        // NOTE: We already fetched the correct version above, so `pin.widget` contains the correct code/props.
        // No need to call getManifest(ver) which was creating "CID=4" errors.

        if (authorizedBundle && authorizedBundle.params) {
            const dataCode = pin.widget?.dataCode;
            const encryptedCode = pin.widget?.encryptedCode;
            const encryptedParams = pin.widget?.encryptedParams;

            // CRITICAL FIX: Merge Defaults + Bundle parameters
            // This ensures hidden secrets (like API keys) defined in 'previewData' but not sent by the client are preserved.
            const paramsToRun = { ...defaultParams, ...authorizedBundle.params, ...overrides };

            if (dataCode || encryptedCode || encryptedParams) {
                const { result } = await executeBoxAction({
                    code: dataCode,
                    encryptedCode: encryptedCode,
                    encryptedParams: encryptedParams, // Pass envelope
                    publicParams: paramsToRun
                });
                if (result) baseProps = { ...baseProps, ...result };
            } else {
                baseProps = { ...baseProps, ...paramsToRun };
            }
        }
    } else {
        const dataCode = pin.widget?.dataCode;
        const encryptedCode = pin.widget?.encryptedCode;
        const encryptedParams = pin.widget?.encryptedParams;

        const storedParams = pin.widget?.previewData || {};
        const paramsToRun = { ...storedParams, ...overrides };

        if (dataCode || encryptedCode || encryptedParams) {
            const tExecStart = performance.now();
            const { result } = await executeBoxAction({
                code: dataCode,
                encryptedCode: encryptedCode,
                encryptedParams: encryptedParams, // Pass envelope
                publicParams: paramsToRun
            });
            console.log(`[Perf] Box Action: ${(performance.now() - tExecStart).toFixed(2)}ms`);
            if (result) baseProps = { ...baseProps, ...result };
        } else {
            baseProps = { ...baseProps, ...paramsToRun };
        }
    }

    if (!uiCode) {
        console.warn(`[OG] No UI Code for Pin ${pinId} (IPFS Failure?)`);
        // throw new Error('NO_UI_CODE');
        // Fallback to basic image? Or just 404? 
        // For now, let's allow it to fail but logged clearly. 
        // Actually, returning a "Generation Failed" image would be better UX.
        throw new Error('NO_UI_CODE'); // Controllers handles this?
    }

    const props = { ...baseProps, title: pin.title, tagline: pin.tagline };

    // 3. Worker Render (Using Helper)
    const { image: pngBuffer } = await renderImageInWorker(uiCode, props, OG_WIDTH, OG_HEIGHT);

    // 4. Cache
    try {
        await redis.set(cacheKey, pngBuffer, 'EX', CACHE_TTL);
        await redis.set(`fresh:${cacheKey}`, '1', 'EX', REVALIDATE_TTL);
    } catch (e) { }
    memoryCache.set(cacheKey, { data: pngBuffer, expires: Date.now() + MEMORY_CACHE_TTL }); // Local memory cache short-lived

    console.log(`[Perf] Total Gen: ${(performance.now() - t0).toFixed(2)}ms`);
    return pngBuffer;
}
