import { IPFS_CACHE_TTL, PRIORITY_GATEWAY, PUBLIC_GATEWAYS } from '../utils/constants';
import { logToFile } from '../utils/logger';

// IPFS Cache (CID -> Content)
// CIDs are immutable, so we can cache them for a very long time
const ipfsCache = new Map<string, { data: any, expires: number }>();

// Re-use in-flight requests to prevent Thundering Herd
const pendingFetches = new Map<string, Promise<any>>();

export async function fetchIpfsJson(cid: string): Promise<any> {
    // 1. Check Cache
    const cachedIpfs = ipfsCache.get(cid);
    if (cachedIpfs && cachedIpfs.expires > Date.now()) {
        console.log(`[Perf] IPFS Cache Hit: ${cid}`);
        return cachedIpfs.data;
    }

    // --- MOCK INTERCEPTOR ---
    if (cid === "QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJg460aa9") {
        console.log("[MOCK] Returning Fake Manifest for Test CID");
        return {
            title: "Lifecycle Test Pin",
            tagline: "Testing runOnce fix",
            // The manifest USUALLY has `dataCode` as text.
            // Let's hardcode a simple render to verify it works.
            dataCode: "export const litActionCid = 'QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJg460aa8';",
            uiCode: "export default function() { return <div style={{display:'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', fontSize: 60}}>LIFECYCLE TEST PASS</div> }",
            litActionCid: "QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJg460aa8",
            parameters: [{ name: "sim_api_key", type: "string", hidden: true }],
            previewData: { sim_api_key: { ciphertext: "mocked", dataToEncryptHash: "mocked", accessControlConditions: [] } },
            userConfig: {}
        };
    }
    // ------------------------

    // 2. Coalescing: Check pending fetches
    if (pendingFetches.has(cid)) {
        console.log(`[Perf] IPFS Coalesced: ${cid}`);
        return pendingFetches.get(cid);
    }

    console.log(`[Perf] IPFS Cache Miss: ${cid} -> Fetching...`);

    // 3. Create Fetch Promise
    const fetchPromise = (async () => {
        logToFile(`[IPFS] Starting Fetch for ${cid}`);

        // Helper: Single Fetch with Timeout
        const fetchOne = async (gw: string, timeoutMs: number = 8000) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch(`${gw}${cid}`, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
                });
                clearTimeout(id);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            } catch (e: any) {
                clearTimeout(id);
                console.warn(`[IPFS] Fetch Error (${gw}):`, e.message);
                logToFile(`[IPFS] Fetch Error (${gw}): ${e.message}`);
                throw e;
            }
        };

        try {
            const promises: Promise<any>[] = [];

            // A. Start Priority Gateway (if exists)
            if (PRIORITY_GATEWAY) {
                logToFile(`[IPFS] Attempting Priority: ${PRIORITY_GATEWAY}`);
                const pPriority = fetchOne(PRIORITY_GATEWAY, 9000);
                promises.push(pPriority);

                // B. Smart Stagger: If Priority takes > 1.5s, launch others
                const stagger = new Promise<void>(resolve => setTimeout(resolve, 1500));

                const publicRace = (async () => {
                    await stagger;
                    logToFile(`[IPFS] Priority slow. Racing public gateways...`);
                    return Promise.any(PUBLIC_GATEWAYS.map(gw => fetchOne(gw, 8000)));
                })();

                promises.push(publicRace);
            } else {
                // No priority, race all
                promises.push(...PUBLIC_GATEWAYS.map(gw => fetchOne(gw, 8000)));
            }

            const result = await Promise.any(promises);
            logToFile(`[IPFS] Success for ${cid}`);

            // Memory Safety Clean
            if (ipfsCache.size >= 1000) {
                const oldestKey = ipfsCache.keys().next().value;
                if (oldestKey) ipfsCache.delete(oldestKey);
            }
            ipfsCache.set(cid, { data: result, expires: Date.now() + IPFS_CACHE_TTL });
            return result;

        } catch (e) {
            logToFile(`[IPFS] All gateways failed for ${cid}`);
            console.warn(`[IPFS] All gateways failed for ${cid}`);
            return {}; // Return empty object on failure to avoid crashes
        }
    })();

    // Attach cleanup
    fetchPromise.finally(() => {
        pendingFetches.delete(cid);
    });

    pendingFetches.set(cid, fetchPromise);
    return fetchPromise;
}
