// Simplified ABI for PinV
// We only need balanceOf, title, tagline, latestVersion, versions, pinStores.
// Copied/Adapted from hooks/contracts.ts to avoid 'wagmi' dependency in standalone service.

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
    8453: (process.env.NEXT_PUBLIC_PINV_ADDRESS_BASE_MAINNET || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    84532: (process.env.NEXT_PUBLIC_PINV_ADDRESS_BASE_SEPOLIA || '0xfB5118bcAec3b6D774307E777679C7Bc16dcE020') as `0x${string}`, // Base Sepolia
} as const;

export const pinVConfig = { address: pinVAddress, abi: pinVAbi } as const;
