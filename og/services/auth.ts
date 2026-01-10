import { parseBundle } from '../utils/bundle';
import { verifySignature } from '../utils/sig';
import { getPin } from '../infra/pin';
import { computeParamsHash } from '../../lib/og-common';

export interface OgContext {
    authorizedBundle: any | null;
    cacheVer: string;
    cacheTs: string;
    cacheParamsHash: string;
    preFetchedPin: any | null;
}

export async function resolveContext(pinId: number, query: any): Promise<OgContext> {
    const { b, sig, ver } = query;
    const ctx: OgContext = {
        authorizedBundle: null,
        cacheVer: 'latest',
        cacheTs: '',
        cacheParamsHash: '',
        preFetchedPin: null
    };

    if (b) {
        const bundle = parseBundle(b);
        if (bundle) {
            let authorized = false;
            // Sig check logic
            if (sig) {
                const signer = await verifySignature(pinId, bundle, sig);
                if (signer) {
                    authorized = true;
                    console.log(`[OG Auth] Signature Verified. Signer: ${signer}`);
                } else {
                    console.log(`[OG Auth] Signature Verification FAILED for bundle.`);
                }
            } else {
                console.log(`[OG Auth] No signature provided.`);
                authorized = true; // Allow unsigned for now (legacy compat)
            }

            if (authorized) {
                ctx.authorizedBundle = bundle;
                ctx.cacheVer = bundle.ver || 'latest';
                ctx.cacheTs = bundle.ts ? String(bundle.ts) : '';
                if (bundle.params) ctx.cacheParamsHash = computeParamsHash(bundle.params);
            }
        }
    } else {
        try {
            const explicitVer = ver ? BigInt(ver) : undefined;
            ctx.preFetchedPin = await getPin(pinId, explicitVer);
            if (ctx.preFetchedPin) {
                ctx.cacheVer = ctx.preFetchedPin.version || (explicitVer ? ver : 'latest') as string;
            }
        } catch (e) { /* ignore */ }
    }

    return ctx;
}
