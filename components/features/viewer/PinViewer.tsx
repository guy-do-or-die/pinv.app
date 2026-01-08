"use client";

import { useState, useEffect } from "react";
import { Pin } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PinParams from "@/components/shared/PinParams";
import PinDisplayCard from "./PinDisplayCard";
import { Share2, Edit, Check, Copy } from "lucide-react";
import { buildOgUrl, buildShareUrl } from "@/lib/services/preview";
import { sdk } from "@farcaster/miniapp-sdk";
import { APP_CONFIG } from "@/lib/config";
import { useAccount } from "@/components/features/wallet";
import { useWalletClient } from "wagmi";
import {
    useReadPinVPinStores,
    useReadPinVStoreSecondaryMintPrice,
    useReadPinVBalanceOf,
    useSimulatePinVSecondaryMint,
    useWritePinVSecondaryMint,
} from "@/hooks/contracts";
import TxButton from "@/components/shared/TxButton";
import { signBundle, encodeBundle, Bundle } from "@/lib/bundle-utils";
import { formatEther } from "viem";
import { cn } from "@/lib/utils";
import { notify } from "@/components/shared/Notifications";

interface PinViewerProps {
    pin: Pin;
    pinId: number;
    initialParams: Record<string, string>;
}

export default function PinViewer({ pin, pinId, initialParams }: PinViewerProps) {
    const parameters = pin.widget?.parameters || [];
    const visibleParameters = parameters.filter((p: any) => !p.hidden);

    const defaults = visibleParameters.reduce((acc: Record<string, string>, p: any) => {
        const val = p.default || p.defaultValue;
        if (val) acc[p.name] = val;
        return acc;
    }, {});

    const mergedInitial = { ...defaults, ...initialParams };

    const { address, loggedIn } = useAccount();
    const { data: walletClient } = useWalletClient();
    const [values, setValues] = useState<Record<string, string>>(mergedInitial);
    const [debouncedValues, setDebouncedValues] = useState<Record<string, string>>(mergedInitial);
    const [signedCache, setSignedCache] = useState<{ params: string, url: string } | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [copied, setCopied] = useState(false);

    // URL states
    const [previewUrl, setPreviewUrl] = useState('');
    const [shareUrl, setShareUrl] = useState('');

    const shareText = APP_CONFIG.shareText || `Here’s my PinV 👇`;
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? 8453 : 84532;

    // --- Contract Reads ---
    const { data: storeAddress } = useReadPinVPinStores({
        args: [BigInt(pinId)],
        query: { enabled: !!pinId }
    });

    const { data: price } = useReadPinVStoreSecondaryMintPrice({
        address: storeAddress,
        query: { enabled: !!storeAddress }
    });

    const { data: balance, refetch: refetchBalance } = useReadPinVBalanceOf({
        args: [address!, BigInt(pinId)],
        query: { enabled: !!address && !!pinId }
    });

    // --- Access Logic ---
    const isCreator = address && pin.creator && address.toLowerCase() === pin.creator.toLowerCase();
    const isOwner = balance && balance > BigInt(0);
    const isDirty = JSON.stringify(values) !== JSON.stringify(mergedInitial);

    // Debounce parameter changes
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only update if values have semantically changed
            if (JSON.stringify(values) !== JSON.stringify(debouncedValues)) {
                setDebouncedValues(values);
            }
        }, 1200);
        return () => clearTimeout(timer);
    }, [values, debouncedValues]);

    // Update URLs (Basic)
    useEffect(() => {
        setPreviewUrl(buildOgUrl(pinId, debouncedValues, true, pin));
        // Note: Default Share URL is simple. Signed Bundle is generated on Demand.
        setShareUrl(buildShareUrl(pinId, values));
    }, [debouncedValues, values, pinId, pin]);

    // --- Handlers ---

    // Helper: Generate Signed URL if dirty
    const getSignedShareUrl = async () => {
        if (!isDirty) return buildShareUrl(pinId, values);

        // Check Cache
        const currentParams = JSON.stringify(values);
        if (signedCache && signedCache.params === currentParams) {
            return signedCache.url;
        }

        if (!walletClient || !address) {
            notify("Please connect wallet to sign custom parameters", "error");
            throw new Error("Wallet not connected");
        }

        const bundle: Bundle = {
            ver: pin.version, // Use specific version if available
            params: values,
            ts: Math.floor(Date.now() / 1000)
        };

        const sig = await signBundle(walletClient, address, pinId, bundle, chainId);
        const b = encodeBundle(bundle);

        // Construct Signed URL
        const url = new URL(window.location.href);
        url.pathname = `/p/${pinId}`;
        url.searchParams.set('b', b);
        url.searchParams.set('sig', sig);
        // Clear other params to keep it clean
        Object.keys(values).forEach(k => url.searchParams.delete(k));

        const finalUrl = url.toString();
        setSignedCache({ params: currentParams, url: finalUrl });
        return finalUrl;
    };

    const handleCopy = async () => {
        try {
            setIsCopying(true);
            const url = await getSignedShareUrl();

            // Attempt to restore focus (common fix for wallet popup race conditions)
            if (typeof window !== 'undefined') window.focus();

            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                notify("Copied to clipboard!", "success");
            }
        } catch (e: any) {
            console.error("Copy failed", e);
            // If signature succeeded but copy failed due to focus/permissions:
            if (e.name === 'NotAllowedError' || e.message?.includes('focus')) {
                notify("Link Signed! Click Copy again to save.", "success");
            } else {
                notify("Failed to generate signed link", "error");
            }
        } finally {
            setIsCopying(false);
        }
    };

    const handleShare = async () => {
        try {
            setIsSharing(true);
            const url = await getSignedShareUrl();

            // 1. Try Miniapp SDK
            const isFramed = typeof window !== 'undefined' && window.parent !== window;
            if (isFramed) {
                try {
                    await sdk.actions.composeCast({
                        text: shareText,
                        embeds: [url],
                    });
                    return;
                } catch (error) { console.warn('SDK share failed', error); }
            }

            // 2. Native Share
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: pin.title,
                        text: pin.tagline,
                        url: url,
                    });
                    return;
                } catch (e) { console.warn('Navigator share failed', e); }
            }

            // 3. Fallback
            const farcastUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(url)}`;
            window.open(farcastUrl, '_blank', 'noopener,noreferrer');

        } catch (e) {
            console.error("Share failed", e);
        } finally {
            setIsSharing(false);
        }
    };



    return (
        <div className="flex flex-col max-w-3xl mx-auto relative">
            <PinDisplayCard
                title={pin.title}
                description={pin.tagline}
                imageSrc={previewUrl}
            >
                <div className="space-y-3 w-full mb-6">
                    {/* Parameter Customization */}
                    {visibleParameters.length > 0 && (
                        <div className="relative rounded-none">
                            {(!isOwner && !isCreator) && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,transparent_20%,hsl(var(--background)/0.8)_100%)] backdrop-blur-[2px] transition-all">
                                    <div className="bg-background/80 px-4 py-1.5 rounded-full border shadow-sm text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-md">
                                        MINT TO CUSTOMIZE
                                    </div>
                                </div>
                            )}
                            <div className={cn((!isOwner && !isCreator) && "pointer-events-none opacity-50")}>
                                <PinParams
                                    parameters={visibleParameters}
                                    values={values}
                                    onChange={setValues}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions Footer */}
                <div className="w-full">
                    <div className="grid grid-cols-3 gap-2 md:gap-4 w-full">
                        <div className="w-full [&>button]:w-full">
                            <Button
                                variant="ghost"
                                className="text-muted-foreground w-full h-10 px-2 font-bold tracking-wider"
                                onClick={handleCopy}
                                disabled={isCopying}
                            >
                                {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                                {isCopying ? "SIGNING..." : (copied ? "COPIED" : "COPY")}
                            </Button>
                        </div>

                        <Button
                            variant="secondary"
                            onClick={handleShare}
                            className="w-full h-10 px-2 font-bold tracking-wider"
                            disabled={isSharing}
                        >
                            <Share2 className="mr-2 h-4 w-4" />
                            {isSharing ? "SIGNING..." : "SHARE"}
                        </Button>

                        <div className="w-full">
                            {isCreator ? (
                                <Button
                                    className="w-full h-10 px-2 font-bold tracking-wider"
                                    asChild
                                >
                                    <Link href={`/p/${pinId}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        EDIT
                                    </Link>
                                </Button>
                            ) : isOwner ? (
                                <Button
                                    className="w-full h-10 px-2 font-bold tracking-wider opacity-80"
                                    disabled
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    MINTED
                                </Button>
                            ) : (
                                <TxButton
                                    simulateHook={useSimulatePinVSecondaryMint}
                                    writeHook={useWritePinVSecondaryMint}
                                    variant="default"
                                    params={{
                                        args: [BigInt(pinId), BigInt(1), "0x"], // tokenId, amount, data
                                        value: price,
                                        enabled: price !== undefined && loggedIn,
                                        onConfirmationSuccess: async () => { await refetchBalance(); }
                                    }}
                                    text={price && price > BigInt(0) ? `MINT (${formatEther(price)} ETH)` : "MINT"}
                                    className="w-full h-10 px-2 font-bold tracking-wider bg-(--brand-blue) text-white hover:opacity-90 border-none"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </PinDisplayCard>
        </div>
    );
}
