"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWalletClient, useAccount, useChainId } from "wagmi";
import { encodeBundle, Bundle } from "@/lib/bundle-utils";

import { uploadToIpfs } from "@/lib/ipfs-client";

interface ManifestData {
    dataCode: string;
    uiCode: string;
    previewData: any;
    parameters: any[];
    userConfig?: any;
}

interface UsePreviewRendererReturn {
    render: (data: ManifestData, pinId: number, version?: string | null) => Promise<{ url: string | null; cid: string | null; signature: string | null; timestamp: number | null }>;
    isLoading: boolean;
    imageUrl: string | null;
    error: string | null;
}

/**
 * Hook for rendering widget previews via the OG Engine (IPFS + Signed Bundle).
 * This ensures consistency with the production workflow.
 */
export function usePreviewRenderer(): UsePreviewRendererReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { data: walletClient } = useWalletClient();
    const { address } = useAccount();
    const chainId = useChainId();

    const render = useCallback(async (
        data: ManifestData,
        pinId: number,
        version?: string | null
    ): Promise<{ url: string | null; cid: string | null; signature: string | null; timestamp: number | null }> => {
        if (!data.uiCode.trim()) {
            setError("No code provided for preview");
            return { url: null, cid: null, signature: null, timestamp: null };
        }

        if (!walletClient || !address) {
            setError("Wallet not connected. Please connect to sign the preview bundle.");
            return { url: null, cid: null, signature: null, timestamp: null };
        }

        setIsLoading(true);
        setError(null);

        try {
            // 2. Upload to Pinata via Shared Utility
            // We pass the data object directly; uploadToIpfs handles stringification and Blob creation.
            // Using specific filename for better organization/debugging
            const filename = `pin-${pinId}-${version ? `v${version}-` : ''}preview-${Date.now()}.json`;
            const cid = await uploadToIpfs(data, filename);

            if (!cid) throw new Error("No CID returned from signed upload");

            // 3. Create Bundle
            const bundle: Bundle = {
                ver: cid,
                params: data.previewData || {},
                ts: Math.floor(Date.now() / 1000)
            };

            // 4. Sign Bundle - REMOVED per user request for smooth UX
            // const signature = await signBundle(walletClient, address, pinId, bundle, chainId);
            const signature = null;

            // 5. Construct OG URL
            const encodedBundle = encodeBundle(bundle);
            // SAME DOMAIN ACCESS: Rely on Next.js Rewrite
            const baseUrl = `/og/${pinId}`;

            // Allow unsigned bundle via new server logic
            // Add timestamp to force fresh render (cache busting)
            let url = `${baseUrl}?b=${encodedBundle}&t=${Date.now()}`;
            if (signature) {
                url += `&sig=${signature}`;
            }

            setImageUrl(url);
            return { url, cid, signature, timestamp: bundle.ts || null };

        } catch (err) {
            const message = err instanceof Error ? err.message : "Preview render failed";
            setError(message);
            console.error("Preview rendering failed:", err);
            return { url: null, cid: null, signature: null, timestamp: null };
        } finally {
            setIsLoading(false);
        }
    }, [walletClient, address, chainId]);

    return {
        render,
        isLoading,
        imageUrl,
        error,
    };
}
