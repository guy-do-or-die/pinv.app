import { createPublicClient, http, zeroAddress } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { pinVConfig, pinVStoreAbi } from '@/common/contracts';
import { fetchFromIpfs } from '@/lib/ipfs';
import { Pin } from '@/types';
import { unstable_cache } from 'next/cache';

const chain = process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? base : baseSepolia;

// Global Client with Multicall enabled
const publicClient = createPublicClient({
    chain,
    transport: http(),
    batch: {
        multicall: true
    }
});

// IPFS Cache (CID -> Content) - Indefinite TTL for Immutable Data
const globalForCache = global as unknown as { ipfsCache: Map<string, any> };
const ipfsCache = globalForCache.ipfsCache || new Map<string, any>();
if (process.env.NODE_ENV !== 'production') globalForCache.ipfsCache = ipfsCache;

const getPinData = async (id: number, version?: number): Promise<Pin | null> => {
    const context = version ? ` (v${version})` : ' (latest)';
    console.log(`[Cache MISS] Fetching fresh Pin Data for ID: ${id}${context}`);
    const t0 = performance.now();
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

        // 2. Read Store Metadata (Multicall Batched)
        const [title, tagline, latestVer, creator] = await Promise.all([
            publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'title' }) as Promise<string>,
            publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'tagline' }) as Promise<string>,
            publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'latestVersion' }) as Promise<bigint>,
            publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'creator' }) as Promise<string>,
        ]);

        const targetVer = version ? BigInt(version) : latestVer;

        // 3. Get IPFS Data
        let widgetData = {};
        if (targetVer > BigInt(0)) {
            const ipfsId = await publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'versions', args: [targetVer] });

            if (ipfsId) {
                const cid = ipfsId as string;
                if (ipfsCache.has(cid)) {
                    widgetData = ipfsCache.get(cid);
                    console.log(`[Perf] Frontend IPFS Cache HIT: ${cid}`);
                } else {
                    console.log(`[Perf] Frontend IPFS Cache MISS: ${cid}`);
                    widgetData = await fetchFromIpfs(cid);
                    ipfsCache.set(cid, widgetData);
                }
            }
        }

        const pin = {
            id: String(id),
            title,
            tagline,
            creator,
            lastUpdated: new Date().toISOString(),
            version: targetVer.toString(),
            widget: widgetData as any
        };

        console.log(`[Cache MISS] Fetched Pin Data for ID: ${id}${context} in ${(performance.now() - t0).toFixed(2)}ms`);
        return pin;
    } catch (e) {
        console.error(`Failed to get pin ${id}`, e);
        return null;
    }
};

const getCachedPin = unstable_cache(getPinData, ['pin-data-v2'], {
    revalidate: 5,
    tags: ['pin-data']
});

export const getPin = async (id: number, version?: number): Promise<Pin | null> => {
    const tStart = performance.now();
    const result = await getCachedPin(id, version);
    console.log(`[getPin] Total time for ID ${id} (Ver: ${version || 'latest'}): ${(performance.now() - tStart).toFixed(2)}ms`);
    return result;
};
