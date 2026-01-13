import { config } from 'dotenv'
import { zeroAddress } from 'viem'
import { defineConfig } from '@wagmi/cli'
import { foundry, react } from '@wagmi/cli/plugins'

import * as chains from "viem/chains"

config()

const foundryPlugin = foundry({
    project: './contracts',
    include: [
        'PinV.json',
        'PinVStore.json',
    ],
    deployments: {
        PinV: {
            [chains.baseSepolia.id]: (process.env.NEXT_PUBLIC_PINV_ADDRESS_BASE_SEPOLIA as `0x${string}`) || zeroAddress,
            [chains.base.id]: (process.env.NEXT_PUBLIC_PINV_ADDRESS_BASE as `0x${string}`) || zeroAddress,
            [chains.foundry.id]: (process.env.NEXT_PUBLIC_PINV_ADDRESS_FOUNDRY as `0x${string}`) || zeroAddress,
        }
    }
})

export default defineConfig([
    {
        out: 'contracts/abi.ts',
        plugins: [
            foundryPlugin
        ],
    },
    {
        out: 'web/hooks/contracts.ts',
        plugins: [
            react(),
            foundryPlugin
        ],
    }
])
