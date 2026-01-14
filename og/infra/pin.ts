import { createPublicClient, http, zeroAddress } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { pinVConfig, pinVStoreAbi } from '../utils/contracts';
import { fetchIpfsJson } from './ipfs';
import { Pin } from '../../types';
import { env } from '../utils/env';

const chainId = env.NEXT_PUBLIC_CHAIN_ID;
const chain = chainId === 8453 ? base : baseSepolia;

export const publicClient = createPublicClient({
    chain,
    transport: http(env.RPC_URL)
});

// Simple LRU Cache
const pinCache = new Map<number, { data: Pin, expires: number }>();
const CACHE_TTL = 5 * 1000;

export async function getPin(id: number, version?: bigint): Promise<Pin | null> {
    // Check Cache
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
            targetVer = version;
            [title, tagline] = await Promise.all([
                publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'title' }),
                publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'tagline' }),
            ]);
        } else {
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
                widgetData = await fetchIpfsJson(cid);
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
