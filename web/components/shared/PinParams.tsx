"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Globe } from "lucide-react";
import { EditableText } from "@/components/ui/editable-text";

export interface ParameterDefinition {
    name: string;
    description?: string;
    type?: "user_setting" | "dynamic_context" | string;
    hidden?: boolean; // Add hidden property
}

interface PinParamsProps {
    parameters: ParameterDefinition[];
    values?: Record<string, string>;
    onChange?: (values: Record<string, string>) => void;
    onParametersChange?: (params: ParameterDefinition[]) => void;
    initialValues?: Record<string, string>;
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

    const handleChange = (name: string, value: string) => {
        if (onChange) {
            onChange({ ...values, [name]: value });
        }
    };

    if (!parameters || parameters.length === 0) {
        return <p className="text-sm text-muted-foreground">No configurable parameters.</p>;
    }

    // Handle metadata update (e.g. toggling visibility)
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

    return (
        <div className={cn("space-y-6 w-full", className)}>
            <div className={cn("grid gap-4")}>
                {parameters.map((param, index) => {
                    // Check if hidden (custom property we're adding logic for)
                    const isHidden = (param as any).hidden;

                    return (
                        <div key={param.name} className="space-y-2 relative group">
                            <Label htmlFor={param.name} className="sr-only">
                                {param.name}
                            </Label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id={param.name}
                                        placeholder={param.name}
                                        value={values[param.name] || ""}
                                        onChange={(e) => handleChange(param.name, e.target.value)}
                                        disabled={disabled}
                                        className={cn(isHidden && "opacity-60 bg-muted/20", "pr-10")}
                                    />
                                    {/* Visibility Toggle inside/near input */}
                                    {!disabled && onParametersChange && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
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
