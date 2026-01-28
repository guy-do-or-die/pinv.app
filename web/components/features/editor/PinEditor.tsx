"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWalletClient } from "wagmi";
import { Pin } from "@/types";
import { useWidgetGeneration, useDataCodeRunner, usePreviewRenderer } from "@/hooks";
import { cn } from "@/lib/utils";
import { encodeBundle } from "@/lib/bundle-utils";
import { EditableText } from "@/components/ui/editable-text";
import { TagsInput } from "@/components/ui/tags-input";
import { unwrapKeyForOwner, decryptData, EncryptedEnvelope } from "@/lib/crypto";

import { EditorPrompt } from "./partials/EditorPrompt";
import { EditorConfig } from "./partials/EditorConfig";
import { EditorCode } from "./partials/EditorCode";
import { EditorLogs } from "./partials/EditorLogs";
import { SavePinButton } from "./partials/SavePinButton";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import PinDisplayCard from "../viewer/PinDisplayCard";

import { Button } from "@/components/ui/button";
import { Play, Settings2, Wand2, Code2, TerminalSquare, ChevronLeft, Loader2, Lock, Unlock } from "lucide-react";
import { notify } from "@/components/shared/Notifications";

interface PinEditorProps {
    pinId: number;
    pin: Pin | null;
}

const SECTION_CONFIG = [
    {
        id: "prompt",
        icon: Wand2,
        label: "Prompt",
    },
    {
        id: "config",
        icon: Settings2,
        label: "Config",
    },
    {
        id: "code",
        icon: Code2,
        label: "Code",
    },
    {
        id: "logs",
        icon: TerminalSquare,
        label: "Logs",
    },
];

/**
 * PinEditor - Orchestrates widget creation and editing.
 * 
 * Uses extracted hooks for logic and partial components for UI.
 */
export default function PinEditor({ pinId, pin }: PinEditorProps) {
    const { isConnected, address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const router = useRouter();

    // Local state for user inputs
    const initialWidget = pin?.widget;

    // Pin Metadata Editing
    const [title, setTitle] = useState(pin?.title || "");
    const [tagline, setTagline] = useState(pin?.tagline || "");

    const [prompt, setPrompt] = useState("");
    const [dataCode, setDataCode] = useState(initialWidget?.dataCode || "");
    const [uiCode, setUICode] = useState(initialWidget?.uiCode || "");
    const [parameters, setParameters] = useState<any[]>(initialWidget?.parameters || []);
    const [previewData, setPreviewData] = useState<Record<string, unknown>>(initialWidget?.previewData || {});
    // Store original encrypted params from manifest (Envelope)
    const [encryptedParams, setEncryptedParams] = useState<any>(initialWidget?.encryptedParams || null);
    const [cachedImageUrl, setCachedImageUrl] = useState<string | null>(null);

    // Unlock State
    const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
    const [isUnlocking, setIsUnlocking] = useState(false);

    const [hasGenerated, setHasGenerated] = useState(!!(initialWidget && initialWidget.uiCode));

    // State for the LAST confirmed/previewed state (Sticky Preview)
    // We only enable save if the CURRENT editor state matches this exactly.
    const [lastPreviewedState, setLastPreviewedState] = useState<{
        uiCode: string;
        dataCode: string;
        parameters: any[];
        previewData: any;
        cid: string;
        signature?: string;
        timestamp?: number;
    } | null>(null);

    // Accordion state - default to 'config'
    const [accordionValue, setAccordionValue] = useState("config");

    // Extracted hooks
    const { generate, isGenerating, error: generateError } = useWidgetGeneration();
    const { run: runDataCode, isRunning: isDataCodeRunning, error: dataCodeError, logs, image: runnerImage } = useDataCodeRunner();
    const { render: renderPreview, isLoading: isPreviewLoading, imageUrl: previewImageUrl } = usePreviewRenderer();

    // Derived Dirty State
    // Check if current editor values differ from the last previewed values
    const isDirty = !lastPreviewedState ||
        lastPreviewedState.uiCode !== uiCode ||
        lastPreviewedState.dataCode !== dataCode ||
        JSON.stringify(lastPreviewedState.parameters) !== JSON.stringify(parameters) ||
        JSON.stringify(lastPreviewedState.previewData) !== JSON.stringify(previewData);

    // Initialize preview if we have existing code
    useEffect(() => {
        if (initialWidget && initialWidget.uiCode && initialWidget.previewData) {
            // OPTIMIZATION: If we have a persisted signature, timestamp, and version (CID),
            // we can reconstruct the URL directly without re-signing!
            if (pin?.version && initialWidget.signature && initialWidget.timestamp) {
                const bundle = {
                    ver: pin.version,
                    params: initialWidget.previewData || {},
                    ts: initialWidget.timestamp
                };
                const encodedBundle = encodeBundle(bundle);
                // SAME DOMAIN ACCESS: Rely on Next.js Rewrite (proxies to 8080 locallly, upstream in prod)
                const baseUrl = `/og/${pinId}`;

                const url = `${baseUrl}?b=${encodedBundle}&sig=${initialWidget.signature}&t=${Date.now()}`;

                setCachedImageUrl(url);
                setLastPreviewedState({
                    uiCode: initialWidget.uiCode,
                    dataCode: initialWidget.dataCode || '',
                    parameters: initialWidget.parameters || [],
                    previewData: initialWidget.previewData,
                    cid: pin.version,
                    signature: initialWidget.signature,
                    timestamp: initialWidget.timestamp
                });
            } else if (pin?.version) {
                // FALLBACK OPTIMIZATION:
                // If we have a version but no signature (legacy pin or simple view),
                // we can still use the ID-based OG endpoint directly.
                // This avoids re-uploading to IPFS just to see what we already have.

                const baseUrl = `/og/${pinId}`;
                // We don't have a bundle signed, so we rely on the backend fetching the version by ID.
                const url = `${baseUrl}?t=${Date.now()}`;

                setCachedImageUrl(url);
                setLastPreviewedState({
                    uiCode: initialWidget.uiCode,
                    dataCode: initialWidget.dataCode || '',
                    parameters: initialWidget.parameters || [],
                    previewData: initialWidget.previewData,
                    cid: pin.version, // Use version ID as the "CID" for dirty checking
                    signature: undefined,
                    timestamp: undefined
                });
            } else {
                // New Pin or Unsaved Changes: Re-generate preview (requires IPFS upload)
                // Pass false for shouldSign
                renderPreview({
                    dataCode: initialWidget.dataCode || '',
                    uiCode: initialWidget.uiCode,
                    previewData: initialWidget.previewData,
                    parameters: initialWidget.parameters || [],
                    userConfig: initialWidget.userConfig,
                    title: pin?.title,
                    tagline: pin?.tagline
                }, pinId, pin?.version, false).then((res) => {
                    if (res && res.cid) {
                        setLastPreviewedState({
                            uiCode: initialWidget.uiCode,
                            dataCode: initialWidget.dataCode || '',
                            parameters: initialWidget.parameters || [],
                            previewData: initialWidget.previewData,
                            cid: res.cid,
                            signature: res.signature || undefined,
                            timestamp: res.timestamp || undefined
                        });
                    }
                });
            }
        }
    }, [initialWidget, renderPreview, pinId, pin?.version]);


    // Handle AI generation
    const handleGenerate = async (fromScratch = false) => {
        if (!prompt.trim()) return;

        let finalPrompt = prompt;
        // If we have existing code, append it to the prompt for iterative refinement
        // UNLESS we are explicitly starting from scratch
        if (!fromScratch && hasGenerated && (dataCode || uiCode)) {
            finalPrompt = `
                User Request: ${prompt}

                Current Data Code:
                \`\`\`javascript
                ${dataCode}
                \`\`\`

                Current UI Code:
                \`\`\`jsx
                ${uiCode}
                \`\`\`

                ${logs && logs.length > 0 ? `
                Execution Logs:
                \`\`\`
                ${logs.map(l => `[${l.timestamp}] ${(l.level || 'info').toUpperCase()}: ${l.message || ''}`).join('\n')}
                \`\`\`
                ` : ''}
            `.trim();
        }

        const result = await generate(finalPrompt, previewData);
        if (result) {
            // Apply Metadata if AI suggested it
            if (result.title) setTitle(result.title);
            if (result.tagline) setTagline(result.tagline);

            setDataCode(result.dataCode);
            setUICode(result.uiCode);
            setParameters(result.parameters);
            setPreviewData(result.previewData);
            setHasGenerated(true);

            // Auto open config after generation to show progress/change
            setAccordionValue("config");

            // 1. Run Unified Preview (Logs + Image) via /og/preview
            // This returns the image Base64 immediately alongside logs
            await runDataCode(result.dataCode, result.previewData, result.uiCode)
                .catch(err => console.warn('[PinEditor] Preview execution failed (non-fatal):', err));

            // 2. Mark as Previewed (Draft)
            setLastPreviewedState({
                uiCode: result.uiCode,
                dataCode: result.dataCode || '',
                parameters: result.parameters || [],
                previewData: result.previewData || {},
                cid: '',
                signature: undefined,
                timestamp: undefined
            });
        }
    };

    // Handle Code execution & Preview Update
    const handleRunDataCode = async (userParams: any = previewData) => {
        // Build user params from current parameter values
        // Note: parameters contains metadata, previewData contains values
        // We use the passed 'userParams' which should be the *values*

        // 1. Run Unified Preview (Logs + Image) via /og/preview
        // This returns the image Base64 immediately alongside logs
        await runDataCode(dataCode, userParams, uiCode, encryptedParams)
            .catch(err => console.warn('[PinEditor] Preview execution failed (non-fatal):', err));

        // 2. Mark as Previewed (Draft)
        // We do NOT upload to IPFS yet. We wait for Save.
        setLastPreviewedState({
            uiCode: uiCode,
            dataCode: dataCode,
            parameters: parameters,
            previewData: userParams,
            cid: '', // Draft state (no CID yet)
            signature: undefined,
            timestamp: undefined
        });
    };

    const currentError = generateError || dataCodeError;

    useEffect(() => {
        if (currentError) {
            // Squelch "Failed to fetch" errors from the DataRunner (optional log-only step)
            // preventing annoyance when local connection to OG engine fails but preview still works.
            if (currentError === 'TypeError: Failed to fetch' || currentError.includes('Failed to fetch')) {
                console.warn('[PinEditor] Suppressed optional runner error:', currentError);
                return;
            }
            notify(currentError, 'error');
        }
    }, [currentError]);

    // Render Helpers
    const renderContent = (id: string) => {
        switch (id) {
            case "prompt":
                return (
                    <EditorPrompt
                        prompt={prompt}
                        setPrompt={setPrompt}
                        isGenerating={isGenerating}
                        isConnected={isConnected}
                        hasGenerated={hasGenerated}
                        error={currentError || null}
                        onGenerate={(fromScratch?: boolean) => { void handleGenerate(fromScratch); }}
                        onBack={() => router.push(`/p/${pinId}`)}
                    />
                );
            case "config":
                return (
                    <EditorConfig
                        encryptedParams={encryptedParams}
                        parameters={parameters}
                        values={previewData as Record<string, any>}
                        onChange={(values) => setPreviewData(values)}
                        onParametersChange={setParameters}
                        sessionKey={sessionKey}
                    />
                );
            case "code":
                return (
                    <EditorCode
                        dataCode={dataCode}
                        setDataCode={setDataCode}
                        uiCode={uiCode}
                        setUICode={setUICode}
                    />
                );
            case "logs":
                return (
                    <EditorLogs logs={logs} />
                );
            default:
                return null;
        }
    };

    return (
        <div className={cn("flex flex-col gap-0 max-w-3xl mx-auto relative", !hasGenerated && "pt-20 md:pt-24")}>
            {hasGenerated ? (
                <>
                    <PinDisplayCard
                        title={
                            <EditableText
                                value={title}
                                onChange={setTitle}
                                placeholder="Untitled Pin"
                                className="text-xl md:text-2xl font-bold"
                            />
                        }
                        description={
                            <TagsInput
                                value={tagline}
                                onChange={setTagline}
                            />
                        }
                        imageSrc={runnerImage || previewImageUrl || cachedImageUrl}
                        isLoading={isGenerating || isPreviewLoading || isDataCodeRunning}
                    >
                        <div className="w-full px-0">
                            <div className="grid grid-cols-3 gap-2 md:gap-4 w-full">
                                <Button
                                    variant="ghost"
                                    onClick={() => router.push(`/p/${pinId}`)}
                                    className="text-muted-foreground w-full h-10 px-2 font-bold tracking-wider"
                                    icon={ChevronLeft}
                                >
                                    BACK
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleRunDataCode(previewData)} // Recalculate with current manual inputs
                                    disabled={isDataCodeRunning || isPreviewLoading || !isDirty}
                                    className="w-full h-10 px-2 font-bold tracking-wider"
                                >
                                    {isDataCodeRunning || isPreviewLoading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            RUNNING
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Play className="w-3 h-3" />
                                            UPDATE
                                        </span>
                                    )}
                                </Button>
                                <SavePinButton
                                    pinId={pinId}
                                    title={title}
                                    tagline={tagline}
                                    uiCode={uiCode}
                                    dataCode={dataCode}
                                    parameters={parameters}
                                    previewData={previewData}
                                    manifestCid={!isDirty && lastPreviewedState ? lastPreviewedState.cid : null}
                                    signature={!isDirty && lastPreviewedState ? lastPreviewedState.signature : undefined}
                                    timestamp={!isDirty && lastPreviewedState ? lastPreviewedState.timestamp : undefined}
                                    currentVersion={pin?.version}
                                    onPrepareSave={async () => {
                                        const res = await renderPreview({
                                            title: title,
                                            tagline: tagline,
                                            dataCode: dataCode,
                                            uiCode: uiCode,
                                            previewData: previewData,
                                            parameters: parameters,
                                            userConfig: initialWidget?.userConfig
                                        }, pinId, pin?.version, true); // true = SIGN BUNDLE for Save

                                        if (res && res.cid) {
                                            setLastPreviewedState({
                                                uiCode: uiCode,
                                                dataCode: dataCode,
                                                parameters: parameters,
                                                previewData: previewData,
                                                cid: res.cid,
                                                signature: res.signature || undefined,
                                                timestamp: res.timestamp || undefined
                                            });
                                            return res; // Return result for sequential flow
                                        }
                                        return null;
                                    }}
                                    disabled={isDataCodeRunning || isPreviewLoading || isDirty}
                                    className="w-full h-10 px-2 font-bold tracking-wider"
                                />
                            </div>
                        </div>
                    </PinDisplayCard>

                    {/* Unlock Banner (Hoisted) */}
                    {(() => {
                        const hasOwnerEnvelope = encryptedParams && typeof encryptedParams === 'string' && encryptedParams.startsWith('{') && encryptedParams.includes('"owner"');
                        const isLocked = !sessionKey && (
                            // Check Params
                            Object.values(previewData).some(v => typeof v === 'string' && (v.startsWith('$$ENC:') || v === '$$ENC:')) ||
                            // Check Code
                            (dataCode.startsWith('$$ENC:') || dataCode === '$$ENC:')
                        );

                        if (hasOwnerEnvelope && isLocked && !sessionKey) {
                            return (
                                <div className="flex items-center justify-between p-3 mb-4 bg-muted/40 rounded-lg border border-dashed">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Lock className="w-4 h-4" />
                                        <span>This Pin contains encrypted secrets.</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            if (!walletClient || !address || !hasOwnerEnvelope) return;
                                            setIsUnlocking(true);
                                            try {
                                                const envelope = JSON.parse(encryptedParams as string) as EncryptedEnvelope;
                                                const msg = `Authorize PinV Secret Access`;
                                                const sig = await walletClient.signMessage({ account: address, message: msg });
                                                const key = await unwrapKeyForOwner(envelope.capsules.owner!, sig);
                                                setSessionKey(key);

                                                // Decrypt all known fields to improve UX immediately
                                                let count = 0;
                                                const newPreviewData = { ...previewData };
                                                let newDataCode = dataCode;

                                                // Params
                                                if (envelope.data) {
                                                    for (const [k, encData] of Object.entries(envelope.data)) {
                                                        if (encData && encData.ciphertext && encData.iv) {
                                                            newPreviewData[k] = await decryptData(encData.ciphertext, encData.iv, key);
                                                            count++;
                                                        }
                                                    }
                                                }
                                                // Code
                                                if (envelope.code) {
                                                    newDataCode = await decryptData(envelope.code.ciphertext, envelope.code.iv, key);
                                                    count++;
                                                }

                                                setPreviewData(newPreviewData);
                                                setDataCode(newDataCode);
                                                notify(`Unlocked ${count} secrets`, 'success');

                                            } catch (e) {
                                                console.error("Unlock failed", e);
                                                notify("Failed to unlock secrets", "error");
                                            } finally {
                                                setIsUnlocking(false);
                                            }
                                        }}
                                        disabled={isUnlocking}
                                        className="gap-2"
                                    >
                                        {isUnlocking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />}
                                        Unlock to Edit
                                    </Button>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    <Accordion
                        type="single"
                        collapsible
                        value={accordionValue}
                        onValueChange={setAccordionValue}
                        className="w-full bg-card border shadow-lg flex flex-col relative"
                    >
                        {SECTION_CONFIG.map((section) => (
                            <AccordionItem
                                key={section.id}
                                value={section.id}
                                className={cn(accordionValue === section.id && "order-first")}
                            >
                                <AccordionTrigger className="text-lg font-semibold px-4 md:px-6 py-4 cursor-pointer items-center hover:bg-accent/50 hover:no-underline">
                                    <span className="flex items-center gap-3">
                                        <section.icon className="h-5 w-5 text-primary" />
                                        <span className="leading-none translate-y-[3px]">{section.label}</span>
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="p-0 border-b-2">
                                    {renderContent(section.id)}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </>
            ) : (
                <div className="w-full bg-card border shadow-lg flex flex-col relative rounded-md">
                    <div className="flex flex-1 items-center justify-between gap-4 py-4 px-4 md:px-6 text-left text-sm font-medium border-b">
                        <span className="flex items-center gap-3">
                            <Wand2 className="h-5 w-5 text-primary" />
                            <span className="text-lg font-semibold leading-none translate-y-[3px]">Prompt</span>
                        </span>
                    </div>
                    <div className="p-0">
                        {renderContent("prompt")}
                    </div>
                </div>
            )}
        </div>
    );
}
