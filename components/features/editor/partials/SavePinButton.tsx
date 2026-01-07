"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "@/components/features/wallet";
import {
    useReadPinVPinStores,
    useSimulatePinVStoreAddVersion,
    useWritePinVStoreAddVersion,
    pinVConfig
} from "@/hooks/contracts";
import { chain } from "@/components/features/wallet";
import TxButton from "@/components/shared/TxButton";
import { notify } from "@/components/shared/Notifications";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface SavePinButtonProps {
    pinId: number;
    title: string;
    tagline: string;
    uiCode: string;
    dataCode: string;
    parameters: any[];
    previewData: Record<string, unknown>;
    manifestCid: string | null;
    signature?: string;
    timestamp?: number;
    disabled?: boolean;
    className?: string;
    onPrepareSave?: () => Promise<void>;
}

export function SavePinButton({
    pinId,
    title,
    tagline,
    uiCode,
    dataCode,
    parameters,
    previewData,
    manifestCid,
    signature,
    timestamp,
    disabled,
    className,
    onPrepareSave
}: SavePinButtonProps) {
    const router = useRouter();
    const { loggedIn } = useAccount();
    const [isPreparing, setIsPreparing] = useState(false);

    // 1. Get Factory Address
    // @ts-ignore - address index signature
    const factoryAddress = pinVConfig.address[chain.id as keyof typeof pinVConfig.address];

    // 2. Read Store Address for this Pin
    const { data: storeAddress } = useReadPinVPinStores({
        args: [BigInt(pinId)],
        query: { enabled: !!pinId }
    });

    // 3. Update Backend Callback
    const handleBackendUpdate = async () => {
        try {
            const savePayload = {
                title,
                tagline,
                widget: {
                    dataCode: dataCode,
                    uiCode: uiCode,
                    parameters,
                    previewData,
                    userConfig: previewData, // Legacy field
                    signature: signature || undefined,
                    timestamp: timestamp || undefined
                }
            };

            const res = await fetch(`/api/pins/${pinId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(savePayload),
            });

            if (!res.ok) throw new Error("Failed to save pin metadata to backend");

            notify('Pin version saved on-chain & metadata updated!', 'success');
            router.push(`/p/${pinId}`);
            router.refresh();
        } catch (e: any) {
            console.error("Backend sync failed:", e);
            notify(`Backend sync failed: ${e.message}`, 'error');
        }
    };

    const handlePrepare = async () => {
        if (!onPrepareSave) return;
        setIsPreparing(true);
        try {
            await onPrepareSave();
        } catch (e) {
            console.error("Prepare save failed:", e);
            notify("Failed to prepare save (IPFS upload)", "error");
        } finally {
            setIsPreparing(false);
        }
    };

    // If we don't have a CID yet, we are in "Draft" mode -> Button triggers Prepare (Upload)
    if (!manifestCid) {
        return (
            <Button
                variant="default" // Use default (Brand Blue usually) or secondary?
                // Using standard button until ready
                className={className || "min-w-[120px]"}
                disabled={disabled || isPreparing || !onPrepareSave}
                onClick={handlePrepare}
            >
                {isPreparing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    "SAVE"
                )}
            </Button>
        );
    }

    // If we DO have a CID, we are Ready -> TxButton triggers On-Chain Write
    return (
        <TxButton
            text="CONFIRM"
            variant="default"
            className={className || "min-w-[120px] bg-green-600 hover:bg-green-700"} // Distinct color for Confirm?
            simulateHook={useSimulatePinVStoreAddVersion}
            writeHook={useWritePinVStoreAddVersion}
            params={{
                address: storeAddress,
                args: [manifestCid || ""], // Should be present now
                enabled: !!storeAddress && loggedIn && !!manifestCid && !disabled,
                onConfirmationSuccess: handleBackendUpdate
            }}
        />
    );
}
