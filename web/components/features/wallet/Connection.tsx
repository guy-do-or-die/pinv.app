'use client';

import { useEffect } from 'react';

import { useConnect, useSwitchChain } from 'wagmi';
import { useAccount, chain } from '@/components/features/wallet';
import { Button } from '@/components/ui/button';


export function Connection() {
    const { loggedIn, address, chainId } = useAccount();
    const { connect, connectors } = useConnect();

    const { switchChain, isPending } = useSwitchChain();

    useEffect(() => {
        if (chainId !== chain.id) {
            switchChain({ chainId: chain.id });
        }
    }, [chainId, chain.id, switchChain]);

    if (!loggedIn) {
        return (
            <Button
                onClick={() => connect({ connector: connectors[0] })}
                className="bg-primary hover:bg-primary/90 text-white font-bold font-sans uppercase tracking-wider rounded-none px-6 h-9 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
                Connect Wallet
            </Button>
        );
    }

    if (chainId !== chain.id) {
        return (
            <Button
                disabled={isPending}
                onClick={() => {
                    if (switchChain) {
                        switchChain({ chainId: chain.id });
                    }
                }}
                variant="destructive"
                className="font-bold font-sans uppercase tracking-wider rounded-none px-6 h-9 shadow-sm"
            >
                Switch to {chain.name}
            </Button>
        );
    }

    return (
        <div className="flex items-center gap-3 text-xs font-mono font-bold px-4 py-2 bg-card border border-border shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-foreground tracking-wider">
                {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
        </div>
    );
}
