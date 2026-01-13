"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@/components/features/wallet";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import {
    useReadPinVStoreTitle,
    useReadPinVStoreTagline,
    useWritePinVStoreUpdateMetadata,
    useReadPinVPinStores,
    useWritePinVStoreAddVersion,
} from "@/web/hooks/contracts";
import { notify } from "@/components/shared/Notifications";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useConfig } from "wagmi";
import { cn } from "@/lib/utils";
import { txLink } from "@/components/shared/Utils";

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
    currentVersion?: string;
    onPrepareSave?: () => Promise<{ cid?: string | null; signature?: string | null } | null | undefined>;
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
    onPrepareSave,
    currentVersion
}: SavePinButtonProps) {
    const router = useRouter();
    const { loggedIn } = useAccount();
    const config = useConfig();
    const [isSaving, setIsSaving] = useState(false);

    const { data: storeAddress } = useReadPinVPinStores({
        args: [BigInt(pinId)],
        query: { enabled: !!pinId }
    });

    const { data: onChainTitle } = useReadPinVStoreTitle({
        address: storeAddress,
        query: { enabled: !!storeAddress }
    });

    const { data: onChainTagline } = useReadPinVStoreTagline({
        address: storeAddress,
        query: { enabled: !!storeAddress }
    });

    // Derived State
    const isMetadataLoaded = onChainTitle !== undefined && onChainTagline !== undefined;
    const isReady = storeAddress && isMetadataLoaded;

    const isDraft = !manifestCid;
    const needsCodeUpdate = isDraft || (manifestCid && manifestCid !== currentVersion);
    const needsMetadataUpdate = isMetadataLoaded && ((title !== onChainTitle) || (tagline !== onChainTagline));

    const { writeContractAsync: addVersion } = useWritePinVStoreAddVersion();
    const { writeContractAsync: updateMetadata } = useWritePinVStoreUpdateMetadata();

    const handleBackendUpdate = async () => {
        try {
            const savePayload = {
                title,
                tagline,
                widget: {
                    dataCode,
                    uiCode,
                    parameters,
                    previewData,
                    userConfig: previewData,
                    signature: signature || undefined,
                    timestamp: timestamp || undefined
                }
            };

            const res = await fetch(`/api/pins/${pinId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(savePayload),
            });

            if (!res.ok) throw new Error("Failed to save backend");

            // Use 'save-flow' ID to replace loading toast with success
            notify(
                <span className="flex items-center gap-1">
                    Saved!
                </span>,
                'success',
                { id: 'save-flow' }
            );
            router.push(`/p/${pinId}`);
            router.refresh();
        } catch (e: any) {
            console.error("Backend sync failed:", e);
            notify(`Backend sync failed: ${e.message}`, 'error', { id: 'save-flow' });
        }
    };

    const handleClick = async () => {
        if (!storeAddress || !loggedIn) return;

        const toastId = 'save-flow';

        try {
            setIsSaving(true);
            let activeCid = manifestCid;

            // 1. Prepare / Sign Bundle (if needed)
            if (activeCid && needsCodeUpdate && signature) {
                // Already valid, proceed
            } else if (onPrepareSave && needsCodeUpdate) {
                notify("Signing Bundle...", "loading", { id: toastId });
                const res = await onPrepareSave();
                if (!res || !res.cid) throw new Error("Bundle preparation failed");
                activeCid = res.cid;
            }

            if (!activeCid && needsCodeUpdate) throw new Error("Missing CID");

            // 2. Add Version (Transaction)
            if (needsCodeUpdate) {
                notify("Sign Transaction...", "loading", { id: toastId });
                const hash = await addVersion({
                    address: storeAddress,
                    args: [activeCid!]
                });

                notify("Verifying Tx...", "loading", { id: toastId });
                await waitForTransactionReceipt(config, { hash });
                notify(
                    <span className="flex items-center gap-1">
                        Version Saved! {txLink(hash, "View Tx")}
                    </span>,
                    "success",
                    { id: toastId, duration: 8000 }
                );
            }

            // 3. Update Metadata (if needed)
            if (needsMetadataUpdate) {
                notify("Updating Metadata...", "loading", { id: toastId });
                try {
                    const hash = await updateMetadata({
                        address: storeAddress,
                        args: [title, tagline]
                    });

                    notify(
                        <span className="flex items-center gap-1">
                            Metadata Updated! {txLink(hash, "View Tx")}
                        </span>,
                        "success",
                        { id: toastId, duration: 8000 }
                    );
                } catch (e) {
                    console.warn("Metadata update skipped/failed", e);
                }
            }

            // 4. Backend Update
            await handleBackendUpdate();

        } catch (e: any) {
            console.error("Save failed", e);
            notify(e.message || "Save failed", "error", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isReady) {
        return (
            <Button variant="ghost" className={className} disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                LOADING...
            </Button>
        );
    }

    if (!needsCodeUpdate && !needsMetadataUpdate) {
        return (
            <Button
                variant="ghost"
                className={cn(className, "bg-(--brand-blue) text-white opacity-50 hover:bg-(--brand-blue)/90 hover:text-white cursor-not-allowed")}
                disabled
            >
                SAVED
            </Button>
        );
    }

    return (
        <Button
            variant="default"
            className={cn(className || "min-w-[120px]", "bg-(--brand-blue) text-white hover:bg-(--brand-blue)/90 border-none")}
            onClick={handleClick}
            disabled={disabled || isSaving}
        >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "SAVING..." : "SAVE"}
        </Button>
    );
}
