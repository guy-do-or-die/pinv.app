"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

interface EditableTextProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    variant?: "input" | "textarea"; // For future extensibility
}

export function EditableText({
    value,
    onChange,
    className,
    placeholder = "Click to edit",
    disabled = false
}: EditableTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        if (localValue !== value) {
            onChange(localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            setLocalValue(value);
            setIsEditing(false);
        }
    };

    if (isEditing && !disabled) {
        return (
            <Input
                ref={inputRef}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={cn("h-auto py-1 px-2 font-inherit", className)}
            />
        );
    }

    return (
        <div
            onClick={() => !disabled && setIsEditing(true)}
            className={cn(
                "group relative cursor-pointer border border-transparent hover:border-border/50 rounded px-2 -mx-2 py-1 transition-colors flex items-center gap-2",
                !value && "text-muted-foreground italic",
                disabled && "cursor-default hover:border-transparent",
                className
            )}
        >
            <span className="truncate">{localValue || placeholder}</span>
            {!disabled && (
                <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
            )}
        </div>
    );
}
