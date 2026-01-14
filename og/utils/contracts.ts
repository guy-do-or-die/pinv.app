// Simplified ABI for PinV
// We only need balanceOf, title, tagline, latestVersion, versions, pinStores.
// Copied/Adapted from hooks/contracts.ts to avoid 'wagmi' dependency in standalone service.

import { env } from './env';

export const pinVAbi = [
    {
        type: 'function',
        inputs: [
            { name: 'account', internalType: 'address', type: 'address' },
            { name: 'id', internalType: 'uint256', type: 'uint256' },
        ],
        name: 'balanceOf',
        outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
        name: 'pinStores',
        outputs: [{ name: '', internalType: 'address', type: 'address' }],
        stateMutability: 'view',
    }
] as const;

export const pinVStoreAbi = [
    {
        type: 'function',
        inputs: [],
        name: 'title',
        outputs: [{ name: '', internalType: 'string', type: 'string' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        inputs: [],
        name: 'tagline',
        outputs: [{ name: '', internalType: 'string', type: 'string' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        inputs: [],
        name: 'latestVersion',
        outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
        name: 'versions',
        outputs: [{ name: '', internalType: 'string', type: 'string' }],
        stateMutability: 'view',
    }
] as const;

export const pinVAddress = {
    8453: (env.NEXT_PUBLIC_PINV_ADDRESS_BASE_MAINNET) as `0x${string}`,
    84532: (env.NEXT_PUBLIC_PINV_ADDRESS_BASE_SEPOLIA) as `0x${string}`, // Base Sepolia
    31337: (env.CONTRACT_ADDRESS) as `0x${string}`,
} as const;

export const pinVConfig = { address: pinVAddress, abi: pinVAbi } as const;
