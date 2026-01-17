import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Globe, Eye, EyeOff } from "lucide-react";
import { EditableText } from "@/components/ui/editable-text";

export interface ParameterDefinition {
    name: string;
    description?: string;
    type?: "user_setting" | "dynamic_context" | string;
    hidden?: boolean; // Add hidden property
}

interface PinParamsProps {
    parameters: ParameterDefinition[];
    values?: Record<string, any>;
    onChange?: (values: Record<string, any>) => void;
    onParametersChange?: (params: ParameterDefinition[]) => void;
    initialValues?: Record<string, any>;
    className?: string;
    disabled?: boolean;
}

/**
 * PinParams - Unified component for displaying and editing pin parameters.
 * Handles both the "view" mode (Share button) and "edit" mode (Inputs).
 */
/**
 * PinParams - Component for displaying and editing pin parameters.
 */
export default function PinParams({
    parameters,
    values: externalValues,
    initialValues,
    onChange,
    onParametersChange,
    className,
    disabled = false
}: PinParamsProps) {
    // Use provided values or defaults
    const values = externalValues || initialValues || {};

    // State for viewing encrypted parameters
    const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});
    const [visibleParams, setVisibleParams] = useState<Record<string, boolean>>({});
    const [decrypting, setDecrypting] = useState<Record<string, boolean>>({});

    const handleChange = (name: string, value: string) => {
        if (onChange) {
            onChange({ ...values, [name]: value });
        }
    };

    const handleDecrypt = async (name: string, value: any) => {
        if (decrypting[name]) return;

        try {
            setDecrypting(prev => ({ ...prev, [name]: true }));
            const { decryptParam } = await import('@/lib/lit-client');
            const decrypted = await decryptParam(value);

            setDecryptedCache(prev => ({ ...prev, [name]: decrypted }));
            setVisibleParams(prev => ({ ...prev, [name]: true }));
        } catch (e) {
            console.error("Decryption failed:", e);
            alert("Failed to decrypt parameter. Ensure you have the correct wallet connected.");
        } finally {
            setDecrypting(prev => ({ ...prev, [name]: false }));
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

    if (!parameters || parameters.length === 0) {
        return <p className="text-sm text-muted-foreground">No configurable parameters.</p>;
    }

    return (
        <div className={cn("space-y-6 w-full", className)}>
            <div className={cn("grid gap-4")}>
                {parameters.map((param, index) => {
                    // Check if hidden (custom property we're adding logic for)
                    const isHidden = (param as any).hidden;
                    const value = values[param.name];

                    // Detect if value is encrypted (it's an object with ciphertext)
                    const isEncrypted = value && typeof value === 'object' && value.ciphertext;
                    const isVisible = visibleParams[param.name];
                    const isDecrypting = decrypting[param.name];

                    // Determine what to display in input
                    let displayValue = "";
                    if (isEncrypted) {
                        if (isVisible) {
                            displayValue = decryptedCache[param.name] || "";
                        } else {
                            displayValue = "(Encrypted)";
                        }
                    } else {
                        // Plain value (string or simple type)
                        displayValue = String(value || "");
                    }

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
                                        value={displayValue}
                                        onChange={(e) => handleChange(param.name, e.target.value)}
                                        disabled={disabled || (isEncrypted && !isVisible)}
                                        readOnly={isEncrypted && !isVisible}
                                        className={cn(isHidden && "opacity-60 bg-muted/20", "pr-20")}
                                        type={isHidden && !isEncrypted ? "password" : "text"} // Mask plaintext if secret
                                    />

                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        {/* Decrypt Toggle for Encrypted Values */}
                                        {isEncrypted && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground"
                                                onClick={() => {
                                                    if (isVisible) {
                                                        setVisibleParams(prev => ({ ...prev, [param.name]: false }));
                                                    } else {
                                                        handleDecrypt(param.name, value);
                                                    }
                                                }}
                                                disabled={isDecrypting}
                                                title={isVisible ? "Hide Value" : "Decrypt & View"}
                                            >
                                                {isDecrypting ? (
                                                    <span className="animate-spin">...</span>
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
        </div>
    );
}
