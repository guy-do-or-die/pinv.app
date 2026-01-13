'use client';

import { useConnect } from 'wagmi';
import { parseEther, parseEventLogs } from 'viem';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import TxButton from '@/components/shared/TxButton';
import { Button } from '@/components/ui/button';

import { useAccount } from '@/components/features/wallet';
import { useSimulatePinVMint, useWritePinV, pinVAbi, useReadPinVConfig } from '@/web/hooks/contracts';

interface MintButtonProps {
    className?: string;
    disabled?: boolean;
}

export default function MintButton({ className, disabled }: MintButtonProps) {
    const { connect, connectors } = useConnect();
    const { address, loggedIn } = useAccount();
    const router = useRouter();

    const { data: configData } = useReadPinVConfig();

    // Default mint parameters
    const mintParams = {
        to: address,
        title: "New Pin",
        tagline: "",
        initialIpfsId: "",
        data: "0x" as `0x${string}`,
    };

    const handleSuccess = (data: any) => {
        // Parse logs to find the Mint event and TokenID
        if (data?.logs) {
            const logs = parseEventLogs({
                abi: pinVAbi,
                eventName: 'Mint',
                logs: data.logs,
            });

            const mintEvent = logs[0];
            if (mintEvent && mintEvent.args.tokenId) {
                const tokenId = mintEvent.args.tokenId.toString();
                router.push(`/p/${tokenId}/edit`);
            }
        }
    };

    if (!loggedIn) {
        return (
            <Button
                className={className}
                size="default"
                icon={Zap}
                onClick={() => connect({ connector: connectors[0] })}
            >
                Connect Wallet
            </Button>
        );
    }

    const mintPrice = configData ? configData[0] : parseEther("0.001");

    return (
        <TxButton
            text="Mint Your Own"
            size="default"
            variant="default"
            className={className}
            simulateHook={useSimulatePinVMint}
            writeHook={useWritePinV}
            params={{
                enabled: loggedIn && !disabled,
                args: [
                    mintParams.to,
                    mintParams.title,
                    mintParams.tagline,
                    mintParams.initialIpfsId,
                    mintParams.data
                ],
                value: mintPrice,
                onConfirmationSuccess: handleSuccess,
            }}
        />
    );
}
