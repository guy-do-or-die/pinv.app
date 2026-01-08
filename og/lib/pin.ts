import { createPublicClient, http, zeroAddress } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { pinVConfig, pinVStoreAbi } from './contracts';
import { fetchFromIpfs } from '../../lib/ipfs';
import { Pin } from '../../types';

const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '84532';
const chain = chainId === '8453' ? base : baseSepolia;
const publicClient = createPublicClient({
    batch: { multicall: true },
    chain,
    transport: http(process.env.RPC_URL)
});

// Simple LRU Cache
const pinCache = new Map<number, { data: Pin, expires: number }>();
const CACHE_TTL = 5 * 1000; // 5 seconds (Reduced from 60s to fix "Previous One" stale issue)

// IPFS Cache (CID -> Content)
// CIDs are immutable, so we can cache them for a very long time (e.g., 24h or indefinite)
const ipfsCache = new Map<string, { data: any, expires: number }>();
const IPFS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getPin(id: number, version?: bigint): Promise<Pin | null> {
    // Check Cache (Only if looking for latest or if we want to cache specific versions later)
    // For now, if version is provided, we bypass cache to ensure freshness, or cache by ID+Ver.
    // Simplifying: Specific version requests bypass simple ID cache.
    if (!version) {
        const cached = pinCache.get(id);
        if (cached && cached.expires > Date.now()) {
            console.log(`[Perf] Pin Cache Hit: ${id}`);
            return cached.data;
        }
    }
    console.log(`[Perf] Pin Cache Miss: ${id} (Ver: ${version || 'latest'})`);

    const chainId = publicClient.chain.id;
    const address = pinVConfig.address[chainId] as `0x${string}`;

    if (address === zeroAddress) return null;

    try {
        // 1. Get Store Address
        const storeAddress = await publicClient.readContract({
            address,
            abi: pinVConfig.abi,
            functionName: 'pinStores',
            args: [BigInt(id)]
        }) as `0x${string}`;

        if (storeAddress === zeroAddress) return null;

        let title, tagline, targetVer;

        if (version) {
            // If version provided, we only need metadata + that version
            targetVer = version;
            [title, tagline] = await Promise.all([
                publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'title' }),
                publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'tagline' }),
            ]);
        } else {
            // Standard Flow
            let latestVer;
            [title, tagline, latestVer] = await Promise.all([
                publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'title' }),
                publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'tagline' }),
                publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'latestVersion' }),
            ]);
            targetVer = latestVer;
        }

        // 3. Get IPFS Data
        let widgetData = {};
        if ((targetVer as bigint) > BigInt(0)) {
            // @ts-ignore
            const ipfsId = await publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'versions', args: [targetVer] });

            if (ipfsId) {
                const cid = ipfsId as string;
                // Check IPFS Cache
                const cachedIpfs = ipfsCache.get(cid);
                if (cachedIpfs && cachedIpfs.expires > Date.now()) {
                    console.log(`[Perf] IPFS Cache Hit: ${cid}`);
                    widgetData = cachedIpfs.data;
                } else {
                    console.log(`[Perf] IPFS Cache Miss: ${cid}`);
                    // @ts-ignore
                    widgetData = await fetchFromIpfs(cid);
                    // Cache It (Long Live)
                    ipfsCache.set(cid, { data: widgetData, expires: Date.now() + IPFS_CACHE_TTL });
                }
            }
        }

        const pin: Pin = {
            id: String(id),
            title: title as string,
            tagline: tagline as string,
            lastUpdated: new Date().toISOString(),
            version: targetVer ? targetVer.toString() : undefined,
            widget: widgetData as any
        };

        // Cache It
        pinCache.set(id, { data: pin, expires: Date.now() + CACHE_TTL });

        return pin;
    } catch (e) {
        console.error(`Failed to get pin ${id}`, e);
        return null;
    }
}
