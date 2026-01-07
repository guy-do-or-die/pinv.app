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
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function getPin(id: number): Promise<Pin | null> {
    // Check Cache
    const cached = pinCache.get(id);
    if (cached && cached.expires > Date.now()) {
        console.log(`[Perf] Pin Cache Hit: ${id}`);
        return cached.data;
    }
    console.log(`[Perf] Pin Cache Miss: ${id}`);

    // @ts-ignore
    const chainId = publicClient.chain.id;
    // @ts-ignore
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

        // 2. Read Store Metadata (Batch with Multicall)
        // Note: readContract in viem treats multiple calls as distinct unless multicall is used explicitly or via batching option.
        // We can use publicClient.multicall if we want explicit control, but Promise.all with batching configuration is easier if client supports it.
        // However, standard viem public client doesn't batch by default without config.
        // Let's use Promise.all for now but with the shared client, it reuses the HTTP connection (keep-alive).

        const [title, tagline, latestVer] = await Promise.all([
            publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'title' }),
            publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'tagline' }),
            publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'latestVersion' }),
        ]);

        // 3. Get IPFS Data
        let widgetData = {};
        if ((latestVer as bigint) > BigInt(0)) {
            // @ts-ignore
            const ipfsId = await publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'versions', args: [latestVer] });
            if (ipfsId) {
                // @ts-ignore
                widgetData = await fetchFromIpfs(ipfsId);
            }
        }

        const pin: Pin = {
            id: String(id),
            title: title as string,
            tagline: tagline as string,
            lastUpdated: new Date().toISOString(),
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
