"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWalletClient, useAccount, useChainId } from "wagmi";
import { encodeBundle, signBundle, Bundle } from "@/lib/bundle-utils";

import { uploadToIpfs } from "@/lib/ipfs-client";
import { fetchBoxPublicKey, encryptWithBoxKey } from "@/lib/box-client";
import { generateSessionKey, encryptData, wrapKeyForBox, wrapKeyForOwner, EncryptedEnvelope } from "@/lib/crypto";

interface ManifestData {
    title?: string;
    tagline?: string;
    dataCode: string;
    encryptedCode?: string; // NEW
    encryptedParams?: string | Record<string, string>;
    uiCode: string;
    previewData: any;
    parameters: any[];
    userConfig?: any;
}

interface UsePreviewRendererReturn {
    render: (data: ManifestData, pinId: number, version?: string | null, shouldSign?: boolean) => Promise<{ url: string | null; cid: string | null; signature: string | null; timestamp: number | null }>;
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
        version?: string | null,
        shouldSign: boolean = false
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
            // 0. Fetch Box Public Key (for Encryption)
            // We do this JIT. In production, we might cache this or store in config?
            // For now, fetching every time ensures we have the latest ephemeral key from local Box.
            let boxPublicKey: string | null = null;
            try {
                boxPublicKey = await fetchBoxPublicKey();
            } catch (e) {
                console.warn("Failed to fetch Box Public Key. Encryption disabled (fallback to plaintext if allowed).", e);
            }

            // 1b. Identify Private Parameters & Code Encryption
            const privateParams = (data.parameters || []).filter(p => p.hidden === true);
            let encryptedCode: string | undefined = undefined;
            // encryptedParams is now a Map of key -> ciphertext
            let encryptedParams: Record<string, string> | undefined = undefined;
            let currentPreviewData = { ...data.previewData };

            // Encrypt Secrets (Session Envelope)
            // Trigger if: Private Params EXIST OR Data Code EXISTS (we treat code as secret by default now in this flow)
            if (privateParams.length > 0 || (boxPublicKey && data.dataCode)) {
                if (!boxPublicKey) {
                    throw new Error("Cannot encrypt private parameters: Box Public Key unavailable.");
                }

                // 1. Generate Session Key (Simulated "Per-Render" Key)
                const sessionKey = await generateSessionKey();

                // 2. Encrypt Data Map (AES-GCM)
                const dataMap: Record<string, { ciphertext: string; iv: string }> = {};

                // Prompt for signature only if we are encrypting secrets
                let ownerSignature: string | undefined = undefined;
                if (address && walletClient && shouldSign) {
                    try {
                        console.log("Requesting signature for Owner Wrapping...");
                        const msg = `Authorize PinV Secret Access`;
                        ownerSignature = await walletClient.signMessage({
                            account: address,
                            message: msg
                        });
                    } catch (e) {
                        console.warn("Owner refused to sign for secret wrapping. Secrets will be Box-Only.");
                    }
                }

                for (const p of privateParams) {
                    const val = currentPreviewData[p.name];

                    if (val !== undefined && val !== null && val !== "") {
                        const strVal = String(val);

                        // Check for locked placeholders
                        if (strVal.startsWith("$$ENC:")) {
                            // Fatal: We cannot re-encrypt a locked secret without unlocking it first.
                            throw new Error(`Cannot save: Parameter '${p.name}' is legally encrypted. Please Unlock secrets to edit/save.`);
                        }

                        const { ciphertext, iv } = await encryptData(strVal, sessionKey);
                        dataMap[p.name] = { ciphertext, iv };

                        // Update previewData to store the placeholder for persistence/UI
                        currentPreviewData[p.name] = `$$ENC:${ciphertext}`;
                    }
                }

                // 2b. Encrypt Code (Optional)
                // If we are already making an envelope, we should encrypt the code into it
                // Using the SAME session key
                let encryptedCodePayload: { ciphertext: string; iv: string } | undefined = undefined;
                if (data.dataCode) {
                    // Start check: is it already locked?
                    if (data.dataCode.startsWith("$$ENC:")) {
                        throw new Error(`Cannot save: Code is locked. Please Unlock to edit/save.`);
                    }

                    encryptedCodePayload = await encryptData(data.dataCode, sessionKey);

                    // Clear plain text
                    data.dataCode = "$$ENC:CODE";
                }

                // 3. Wrap Keys
                const boxCapsule = await wrapKeyForBox(sessionKey, boxPublicKey);
                let ownerCapsule: string | undefined = undefined;

                if (ownerSignature) {
                    ownerCapsule = await wrapKeyForOwner(sessionKey, ownerSignature);
                }

                // 4. Construct Envelope
                // encryptedParams is typed as string | Record. We use string (JSON) for Envelope.
                const envelope: EncryptedEnvelope = {
                    capsules: {
                        box: boxCapsule,
                        owner: ownerCapsule
                    },
                    data: dataMap,
                    code: encryptedCodePayload // Add code payload
                };

                // Force cast or just assign if type allows
                // @ts-ignore
                encryptedParams = JSON.stringify(envelope);
            } else if (data.dataCode) {
                // Fallback: If no private params, we might still want to encrypt code?
                // But strictly, the user wanted "Encrypt Datacode" feature. 
                // Currently, we only trigger envelope creation if there are private params.
                // TODO: We should probably trigger envelope creation if data.dataCode exists AND we want it encrypted? 
                // For now, let's assume we ALWAYS encrypt code if we can? 
                // Or only if user flagged it? 
                // Code is "always encrypted" in the new model if Box Key exists?
                // Let's stick to: "If private params exist OR we decide code is private"
            }

            // 1c. Bake current values into Parameters defaults (excluding secrets)
            const bakedParameters = (data.parameters || []).map(p => {
                // If it's a secret, we don't bake the value into default (it's in encryptedParams)
                if (p.hidden) return p;

                const val = currentPreviewData[p.name];
                if (val !== undefined) {
                    return {
                        ...p,
                        default: val,
                        defaultValue: val
                    };
                }
                return p;
            });

            const bakedData = {
                ...data,
                encryptedCode: encryptedCode,
                dataCode: encryptedCode ? "" : data.dataCode, // Clear plaintext logic
                encryptedParams: encryptedParams, // Map
                parameters: bakedParameters,
                previewData: currentPreviewData // Contains $$ENC: strings
            };

            // 2. Upload to Pinata via Shared Utility
            // We pass the data object directly; uploadToIpfs handles stringification and Blob creation.
            // Using specific filename for better organization/debugging
            const filename = `pin-${pinId}-${version ? `v${version}-` : ''}preview-${Date.now()}.json`;

            // NOTE: We rely on the existing uploadToIpfs utility. 
            // In the future, we might want to ensure 'dataCode' is stripped from the JSON completely if desired?
            // Currently above: dataCode set to empty string if encrypted.

            const cid = await uploadToIpfs(bakedData, filename);

            if (!cid) throw new Error("No CID returned from signed upload");

            // 3. Create Bundle
            const bundle: Bundle = {
                ver: cid,
                params: currentPreviewData || {}, // Use the encrypted data
                ts: Math.floor(Date.now() / 1000)
            };

            // ... rest of function matches exactly (signing, URL construction)

            // 4. Sign Bundle (Conditionally)
            let signature: string | null = null;
            if (shouldSign) {
                signature = await signBundle(walletClient, address, pinId, bundle, chainId);
            }

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
