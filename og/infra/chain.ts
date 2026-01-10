import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { pinVConfig } from '../utils/contracts';

const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532');
const CHAIN = CHAIN_ID === 8453 ? base : baseSepolia;

const client = createPublicClient({
    chain: CHAIN,
    transport: http(process.env.RPC_URL)
});

export async function checkOwnership(address: string, tokenId: number): Promise<boolean> {
    try {
        const balance = await client.readContract({
            address: pinVConfig.address[CHAIN_ID as 8453 | 84532] as `0x${string}`,
            abi: pinVConfig.abi,
            functionName: 'balanceOf',
            args: [address as `0x${string}`, BigInt(tokenId)]
        });

        // @ts-ignore
        return balance > BigInt(0);
    } catch (e) {
        console.error('Ownership check failed:', e);
        return false;
    }
}
