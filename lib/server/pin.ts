import { createPublicClient, http, zeroAddress } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { pinVConfig, pinVStoreAbi } from '@/hooks/contracts';
import { fetchFromIpfs } from '@/lib/ipfs';
import { Pin } from '@/types';

const chain = process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? base : baseSepolia;

// Global Client with Multicall enabled
const publicClient = createPublicClient({
    chain,
    transport: http(),
    batch: {
        multicall: true
    }
});

export async function getPin(id: number): Promise<Pin | null> {
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
        // We use the multicall-enabled client, letting viem batch these automatically via Promise.all
        // or we can use explicit multicall if we want strict guarantees, but simple Promise.all with batch client is usually cleaner.

        const [title, tagline, latestVer] = await Promise.all([
            publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'title' }) as Promise<string>,
            publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'tagline' }) as Promise<string>,
            publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'latestVersion' }) as Promise<bigint>,
        ]);

        // 3. Get IPFS Data
        let widgetData = {};
        if (latestVer > BigInt(0)) {
            const ipfsId = await publicClient.readContract({ address: storeAddress, abi: pinVStoreAbi, functionName: 'versions', args: [latestVer] });

            if (ipfsId) {
                widgetData = await fetchFromIpfs(ipfsId as string);
            }
        }

        return {
            id: String(id),
            title,
            tagline,
            lastUpdated: new Date().toISOString(),
            widget: widgetData as any
        };
    } catch (e) {
        console.error(`Failed to get pin ${id}`, e);
        return null;
    }
}
