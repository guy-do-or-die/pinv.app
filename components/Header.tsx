'use client';

import { useAccount, useConnect } from 'wagmi';
import { Button } from "@/components/ui/button";

export default function Header() {
    const { isConnected, address } = useAccount();
    const { connect, connectors } = useConnect();

    return (
        <div className="w-full flex justify-between items-center mb-8">
            <div className="text-sm font-medium opacity-70 uppercase tracking-widest">
                PinV
            </div>
            <div className="flex justify-end">
                {isConnected ? (
                    <div className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-muted rounded-full">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </div>
                ) : (
                    <Button
                        onClick={() => connect({ connector: connectors[0] })}
                        variant="outline"
                    >
                        Connect Wallet
                    </Button>
                )}
            </div>
        </div>
    );
}
