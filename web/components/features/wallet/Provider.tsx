import { http, cookieStorage, createConfig, createStorage } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

import { WagmiProvider, useAccount as useWagmiAccount } from 'wagmi'
import { injected } from 'wagmi/connectors'
import * as chains from 'wagmi/chains'

import { OnchainKitProvider } from '@coinbase/onchainkit'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

export const supportedChains = {
    main: chains.base,
    test: chains.baseSepolia,
    local: chains.foundry,
}

const envChainKey = (process.env.NEXT_PUBLIC_CHAIN || 'test').toLowerCase()
export const chain = supportedChains[envChainKey as keyof typeof supportedChains] || supportedChains.test

declare module 'wagmi' {
    interface Register {
        config: ReturnType<typeof getConfig>
    }
}

export function getConfig() {
    return createConfig({
        chains: [chain],
        connectors: [
            farcasterMiniApp(),
            injected(),
        ],
        storage: createStorage({
            storage: cookieStorage,
        }),
        ssr: true,
        transports: {
            [chains.base.id]: http(),
            [chains.baseSepolia.id]: http(),
            [chains.foundry.id]: http(),
        },
    })
}


export const useAccount = () => {
    const { address, isConnected: loggedIn, chainId } = useWagmiAccount()
    return { address, loggedIn, chainId }
}


export default function WalletProvider({ children }: { children: ReactNode }) {
    const [config] = useState(() => getConfig())
    const [queryClient] = useState(() => new QueryClient())

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <OnchainKitProvider apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY} chain={chain}>
                    {children}
                </OnchainKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}