"use client";

import { env } from "@/env";

import { useState, useEffect, useRef } from "react";
import { Pin } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PinParams from "@/components/shared/PinParams";
import PinDisplayCard from "./PinDisplayCard";
import { Share2, Edit, Check, Copy, ChevronUp, ChevronDown } from "lucide-react";
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
    useReadPinVStoreLatestVersion,
    useReadPinVStoreVersions,
} from "@/hooks/contracts";
import TxButton from "@/components/shared/TxButton";
import { signBundle, encodeBundle, Bundle } from "@/lib/bundle-utils";
import { formatEther } from "viem";
import { cn } from "@/lib/utils";
import { notify } from "@/components/shared/Notifications";
import { fetchFromIpfs } from "@/lib/ipfs";

interface PinViewerProps {
    pin: Pin;
    pinId: number;
    initialParams: Record<string, string>;
}

export default function PinViewer({ pin, pinId, initialParams }: PinViewerProps) {
    // State for the currently displayed version (starts with initial pin)
    const [activePin, setActivePin] = useState<Pin>(pin);
    const [selectedVer, setSelectedVer] = useState<bigint>(pin.version ? BigInt(pin.version) : 1n);
    const [isLoadingVersion, setIsLoadingVersion] = useState(false);

    const parameters = activePin.widget?.parameters || [];
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

    // Lock to prevent concurrent signature requests
    const isSigningRef = useRef(false);

    // URL states
    const [previewUrl, setPreviewUrl] = useState('');
    const [shareUrl, setShareUrl] = useState('');

    const shareText = APP_CONFIG.shareText || `Here’s my PinV 👇`;
    // Force Chain ID to Base Mainnet if PROD is implied, otherwise Base Sepolia
    const chainId = env.NEXT_PUBLIC_CHAIN_ID === 8453 ? 8453 : 84532;


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

    const { data: latestVersion } = useReadPinVStoreLatestVersion({
        address: storeAddress,
        query: { enabled: !!storeAddress }
    });

    // Fetch CID for selected version if it differs from initial
    const { data: versionCid } = useReadPinVStoreVersions({
        address: storeAddress,
        args: [selectedVer],
        query: { enabled: !!storeAddress && selectedVer !== (pin.version ? BigInt(pin.version) : 0n) }
    });

    // --- Effects ---

    // 1. Fetch Version Data when CID changes
    useEffect(() => {
        const fetchVersionData = async () => {
            // If selected version matches initial pin, reset to initial (avoid fetch)
            if (pin.version && selectedVer === BigInt(pin.version)) {
                setActivePin(pin);
                // Reset values to initial params (optional, or keep user edits? keeping edits is better UX usually, but dangerous if schema changed)
                // For safety, let's mixin defaults again
                return;
            }

            if (versionCid) {
                setIsLoadingVersion(true);
                try {
                    const widgetData = await fetchFromIpfs(versionCid);
                    setActivePin(prev => ({
                        ...prev,
                        version: selectedVer.toString(),
                        widget: widgetData
                    }));

                    // Reset values to defaults of the new version
                    const newParams = widgetData.parameters || [];
                    const newDefaults = newParams.reduce((acc: Record<string, string>, p: any) => {
                        const val = p.default || p.defaultValue;
                        if (val) acc[p.name] = val;
                        return acc;
                    }, {});
                    setValues(newDefaults);
                } catch (e) {
                    console.error("Failed to load version", e);
                    notify("Failed to load version data", "error");
                } finally {
                    setIsLoadingVersion(false);
                }
            }
        };

        fetchVersionData();
    }, [versionCid, selectedVer, pin]);


    const isCreator = address && activePin.creator && address.toLowerCase() === activePin.creator.toLowerCase();
    const isOwner = balance && balance > BigInt(0);
    const isDirty = JSON.stringify(values) !== JSON.stringify(mergedInitial); // Note: mergedInitial is stale if version changed? 
    // Fix: mergedInitial depends on defaults, which depends on activePin. So check is correct.

    // Debounce parameter changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (JSON.stringify(values) !== JSON.stringify(debouncedValues)) {
                setDebouncedValues(values);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [values, debouncedValues]);

    // Update URLs
    useEffect(() => {
        setPreviewUrl(buildOgUrl(pinId, debouncedValues, true, activePin));
    }, [debouncedValues, pinId, activePin]);

    useEffect(() => {
        setShareUrl(buildShareUrl(pinId, values));
    }, [values, pinId]);

    // --- Handlers ---

    const getSignedShareUrl = async () => {
        // Block concurrent requests if already signing
        if (isSigningRef.current) return null;

        // If parameters are clean AND we are on the latest version, we can share the naked URL.
        // Otherwise (dirty params OR historical version), we must sign a bundle to preserve the exact version/state.
        const isLatest = latestVersion !== undefined && selectedVer === latestVersion;

        if (!isDirty && isLatest) return buildShareUrl(pinId, values);

        const currentParams = JSON.stringify(values);
        if (signedCache && signedCache.params === currentParams) {
            return signedCache.url;
        }

        if (!walletClient || !address) {
            notify("Please connect wallet to sign custom parameters", "error");
            throw new Error("Wallet not connected");
        }

        const bundle: Bundle = {
            ver: activePin.version,
            params: values,
            ts: Math.floor(Date.now() / 1000)
        };

        try {
            isSigningRef.current = true;
            const sig = await signBundle(walletClient, address, pinId, bundle, chainId);
            const b = encodeBundle(bundle);

            const url = new URL(window.location.href);
            url.pathname = `/p/${pinId}`;
            url.searchParams.set('b', b);
            url.searchParams.set('sig', sig);
            Object.keys(values).forEach(k => url.searchParams.delete(k));

            const finalUrl = url.toString();
            setSignedCache({ params: currentParams, url: finalUrl });
            return finalUrl;
        } finally {
            isSigningRef.current = false;
        }
    };

    const handleCopy = async () => {
        try {
            setIsCopying(true);
            const url = await getSignedShareUrl();
            if (!url) return; // Locked

            const copyToClipboard = async (text: string) => {
                if (navigator.clipboard?.writeText) {
                    try {
                        await navigator.clipboard.writeText(text);
                        return true;
                    } catch (e) { console.warn("Async copy failed", e); }
                }
                try {
                    const textArea = document.createElement("textarea");
                    textArea.value = text;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-9999px";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    return successful;
                } catch (e) {
                    return false;
                }
            };

            const success = await copyToClipboard(url);
            if (success) {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                notify("Copied to clipboard!", "success");
            } else {
                notify("Link Signed! Click Copy again manually.", "warning");
            }
        } catch (e: any) {
            console.error("Copy failed", e);
            notify("Failed to generate signed link", "error");
        } finally {
            setIsCopying(false);
        }
    };

    const handleShare = async () => {
        try {
            setIsSharing(true);
            const url = await getSignedShareUrl();
            if (!url) return; // Locked

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

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: activePin.title,
                        text: activePin.tagline,
                        url: url,
                    });
                    return;
                } catch (e) { console.warn('Navigator share failed', e); }
            }

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
                title={
                    <div className="flex items-center justify-between gap-4 w-full">
                        <span>{activePin.title}</span>
                        <div className="flex items-center gap-2">
                            {latestVersion && latestVersion > 1n ? (
                                <div className="flex items-center bg-muted/50 rounded-lg p-0.5 gap-1 border border-border/50 h-8">
                                    <div className="pl-1.5 flex items-center gap-0.5">
                                        <span className="text-xs font-mono text-muted-foreground mr-0.5 font-bold">v</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max={latestVersion.toString()}
                                            value={selectedVer.toString()}
                                            onChange={(e) => {
                                                const val = BigInt(e.target.value || 0);
                                                if (val > 0n && val <= latestVersion) setSelectedVer(val);
                                            }}
                                            className="min-w-6 w-8 bg-transparent text-sm font-mono text-center focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                                        />
                                    </div>

                                    <div className="flex flex-col h-full border-l border-border/10">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-3.5 w-4 rounded-tr rounded-tl-none rounded-br-none hover:bg-background"
                                            disabled={selectedVer >= latestVersion}
                                            onClick={() => setSelectedVer(v => v < latestVersion ? v + 1n : v)}
                                        >
                                            <ChevronUp className="h-2.5 w-2.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-3.5 w-4 rounded-br rounded-bl-none rounded-tr-none hover:bg-background"
                                            disabled={selectedVer <= 1n}
                                            onClick={() => setSelectedVer(v => v > 1n ? v - 1n : v)}
                                        >
                                            <ChevronDown className="h-2.5 w-2.5" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                    {`v${activePin.version || '1'}`}
                                </span>
                            )}
                        </div>
                    </div>
                }
                description={activePin.tagline}
                imageSrc={previewUrl}
            >
                <div className="space-y-3 w-full mb-6 relative">
                    {isLoadingVersion && (
                        <div className="absolute inset-0 z-20 bg-background/50 flex items-center justify-center backdrop-blur-sm rounded">
                            <span className="text-xs font-bold animate-pulse">LOADING v{selectedVer.toString()}...</span>
                        </div>
                    )}

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
                                    encryptedParams={activePin.widget?.encryptedParams}
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
