import { useState } from "react";
import { useWalletClient, useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Globe, Eye, EyeOff, Loader2, Unlock } from "lucide-react";
import { EditableText } from "@/components/ui/editable-text";
import { unwrapKeyForOwner, decryptData, EncryptedEnvelope } from "@/lib/crypto";

export interface ParameterDefinition {
    name: string;
    description?: string;
    type?: "user_setting" | "dynamic_context" | string;
    hidden?: boolean; // Add hidden property
}

interface PinParamsProps {
    encryptedParams?: string | Record<string, string>; // Envelope (JSON) or Map
    parameters: ParameterDefinition[];
    values?: Record<string, any>;
    onChange?: (values: Record<string, any>) => void;
    onParametersChange?: (params: ParameterDefinition[]) => void;
    initialValues?: Record<string, any>;
    className?: string;
    disabled?: boolean;
    sessionKey?: CryptoKey | null;
    hideUnlockBanner?: boolean;
}

/**
 * PinParams - Unified component for displaying and editing pin parameters.
 * Handles both the "view" mode (Share button) and "edit" mode (Inputs).
 */
export default function PinParams({
    encryptedParams,
    parameters,
    values: externalValues,
    initialValues,
    onChange,
    onParametersChange,
    className,
    disabled = false,
    sessionKey: externalSessionKey,
    hideUnlockBanner = false
}: PinParamsProps) {
    const { data: walletClient } = useWalletClient();
    const { address } = useAccount();
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [internalSessionKey, setInternalSessionKey] = useState<CryptoKey | null>(null);
    const [visibleParams, setVisibleParams] = useState<Record<string, boolean>>({});
    const [decryptingParams, setDecryptingParams] = useState<Record<string, boolean>>({});

    // Use external key if provided, otherwise internal
    const sessionKey = externalSessionKey ?? internalSessionKey;

    // Use provided values or defaults
    const values = externalValues || initialValues || {};

    const handleChange = (name: string, value: string) => {
        if (onChange) {
            onChange({ ...values, [name]: value });
        }
    };

    const toggleVisibility = (index: number) => {
        if (!onParametersChange) return;

        const newParams = [...parameters];
        const currentParam = newParams[index];
        // Toggle 'hidden': logic is 'hidden' property. 
        // If hidden is true, it's private. If undefined/false, it's public.
        newParams[index] = {
            ...currentParam,
            hidden: !(currentParam as any).hidden
        };

        onParametersChange(newParams);
    };

    const updateDescription = (index: number, newDesc: string) => {
        if (!onParametersChange) return;
        const newParams = [...parameters];
        newParams[index] = { ...newParams[index], description: newDesc };
        onParametersChange(newParams);
    };

    // Unlock Logic
    // Detect if we have an Envelope that potentially has an Owner Capsule
    const hasOwnerEnvelope = encryptedParams && typeof encryptedParams === 'string' && encryptedParams.startsWith('{') && encryptedParams.includes('"owner"');

    // Check if we assume it is still locked (at least one value is $$ENC or placeholder)
    const isLocked = Object.values(values).some(v => typeof v === 'string' && (v.startsWith('$$ENC:') || v === '$$ENC:'));

    const handleUnlock = async () => {
        if (!walletClient || !address || !hasOwnerEnvelope) return;
        setIsUnlocking(true);
        try {
            const envelope = JSON.parse(encryptedParams as string) as EncryptedEnvelope;
            if (!envelope.capsules.owner) {
                // Should not happen given hasOwnerEnvelope check
                return;
            }

            // Sign
            const msg = `Authorize PinV Secret Access`;
            const sig = await walletClient.signMessage({ account: address, message: msg });

            // Unwrap
            const sessionKey = await unwrapKeyForOwner(envelope.capsules.owner, sig);
            setInternalSessionKey(sessionKey);

            // Decrypt All
            const newValues = { ...values };
            let count = 0;
            for (const [key, encData] of Object.entries(envelope.data)) {
                // Only decrypt if we have valid ciphertext and the current value is a placeholder
                // Actually, we should just overwrite with decrypted truth.
                if (encData && encData.ciphertext && encData.iv) {
                    const plaintext = await decryptData(encData.ciphertext, encData.iv, sessionKey);
                    newValues[key] = plaintext;
                    count++;
                }
            }
            console.log(`Unlocked ${count} secrets.`);

            // Update parent
            if (onChange) {
                onChange(newValues);
            }
        } catch (e: any) {
            console.error("Unlock failed", e);
            // alert? or just log.
        } finally {
            setIsUnlocking(false);
        }
    };

    const handleDecrypt = async (paramName: string, currentValue: string) => {
        // If not encrypted (just hidden), just toggle visibility is handled by caller logic usually,
        // but here we are in "Actions".
        // If we have sessionKey, we just decrypt.
        // If not, we trigger unlock flow.

        if (!walletClient || !address || !hasOwnerEnvelope) return;

        setDecryptingParams(prev => ({ ...prev, [paramName]: true }));
        try {
            let key = sessionKey;

            // 1. Get Key if missing
            if (!key) {
                const envelope = JSON.parse(encryptedParams as string) as EncryptedEnvelope;
                if (!envelope.capsules.owner) return;

                const msg = `Authorize PinV Secret Access`;
                const sig = await walletClient.signMessage({ account: address, message: msg });
                key = await unwrapKeyForOwner(envelope.capsules.owner, sig);
                setInternalSessionKey(key);
            }

            // 2. Decrypt THIS parameter (or all? Let's just do all to be efficient for UX)
            // But for now, let's just make sure we decrypt the one requested and update values.
            const envelope = JSON.parse(encryptedParams as string) as EncryptedEnvelope;
            const encData = envelope.data[paramName];

            if (encData && encData.ciphertext && encData.iv) {
                const plaintext = await decryptData(encData.ciphertext, encData.iv, key);
                if (onChange) {
                    onChange({ ...values, [paramName]: plaintext });
                }
                setVisibleParams(prev => ({ ...prev, [paramName]: true }));
            }
        } catch (e) {
            console.error("Decrypt failed", e);
        } finally {
            setDecryptingParams(prev => ({ ...prev, [paramName]: false }));
        }
    };

    if (!parameters || parameters.length === 0) {
        return <p className="text-sm text-muted-foreground">No configurable parameters.</p>;
    }

    return (
        <div className={cn("space-y-6 w-full", className)}>
            {/* Unlock Banner */}
            {hasOwnerEnvelope && isLocked && !disabled && !sessionKey && !hideUnlockBanner && (
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-dashed">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Lock className="w-4 h-4" />
                        <span>This Pin contains encrypted secrets.</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUnlock}
                        disabled={isUnlocking}
                        className="gap-2"
                    >
                        {isUnlocking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />}
                        Unlock to Edit
                    </Button>
                </div>
            )}

            <div className={cn("grid gap-4")}>
                {parameters.map((param, index) => {
                    // Check if hidden (custom property we're adding logic for)
                    const isHidden = (param as any).hidden;
                    const value = values[param.name];

                    // Detect if value is encrypted
                    const strVal = String(value || "");
                    const isEncryptedPlaceholder = strVal.startsWith('$$ENC:') || (strVal.length > 100 && !strVal.includes(' '));
                    // Real check: is it effectively encrypted for the user?
                    // If we have sessionKey, we consider it "unlocked" (so user sees plaintext if visible).
                    // But 'value' in 'values' might still be the ciphertext string if we haven't decrypted it yet.

                    const isEncrypted = isEncryptedPlaceholder;
                    const isVisible = visibleParams[param.name];
                    const isDecrypting = decryptingParams[param.name];

                    return (
                        <div key={param.name} className="space-y-2 relative group">
                            <Label htmlFor={param.name} className="sr-only">
                                {param.name}
                            </Label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1 flex items-center">
                                    <Input
                                        id={param.name}
                                        placeholder={param.name}
                                        value={isEncrypted ? "(Encrypted Secret)" : strVal}
                                        onChange={(e) => handleChange(param.name, e.target.value)}
                                        disabled={disabled}
                                        className={cn(isHidden && "opacity-60 bg-muted/20", "pr-20")}
                                        // Show password if hidden AND NOT explicitly made visible
                                        type={isHidden && !isVisible ? "password" : "text"}
                                        readOnly={isEncrypted && !hasOwnerEnvelope}
                                    />

                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">

                                        {/* Decrypt/Eye Toggle */}
                                        {(isHidden || isEncrypted) && !disabled && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground"
                                                onClick={() => {
                                                    if (isVisible) {
                                                        setVisibleParams(prev => ({ ...prev, [param.name]: false }));
                                                    } else {
                                                        if (!isEncrypted) {
                                                            setVisibleParams(prev => ({ ...prev, [param.name]: true }));
                                                        } else {
                                                            handleDecrypt(param.name, strVal);
                                                        }
                                                    }
                                                }}
                                                disabled={isDecrypting}
                                                title={isVisible ? "Hide Value" : "Decrypt & View"}
                                            >
                                                {isDecrypting ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : isVisible ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}

                                        {/* Configuration Toggle (Lock/World) */}
                                        {!disabled && onParametersChange && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground"
                                                onClick={() => toggleVisibility(index)}
                                                title={isHidden ? "Private (Encrypted)" : "Public (URL Param)"}
                                            >
                                                {isHidden ? (
                                                    <Lock className="h-4 w-4" />
                                                ) : (
                                                    <Globe className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* Editable Description (Hint) */}
                            {onParametersChange ? (
                                <EditableText
                                    value={param.description || ""}
                                    onChange={(val) => updateDescription(index, val)}
                                    placeholder={`Add hint for ${param.name}...`}
                                    className="text-xs text-muted-foreground"
                                />
                            ) : (
                                param.description && (
                                    <p className="text-xs text-muted-foreground">
                                        {param.description}
                                    </p>
                                )
                            )}
                        </div>
                    );
                })}
            </div>
        </div >
    );
}
