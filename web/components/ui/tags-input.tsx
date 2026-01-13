"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge"; // Removed dependency
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagsInputProps {
    value: string; // Comma separated string
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    suggestions?: string[]; // For future "choosing from existing"
}

export function TagsInput({
    value,
    onChange,
    className,
    placeholder = "Add tag...",
    disabled = false
}: TagsInputProps) {
    const [tags, setTags] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isInputVisible, setIsInputVisible] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Parse CSV to tags
        const parsed = value
            ? value.split(",").map(t => t.trim()).filter(Boolean)
            : [];
        setTags(parsed);
    }, [value]);

    useEffect(() => {
        if (isInputVisible && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isInputVisible]);

    const updateParent = (newTags: string[]) => {
        onChange(newTags.join(", "));
    };

    const handleAddTag = () => {
        const trimmed = inputValue.trim();
        if (trimmed && !tags.includes(trimmed)) {
            const newTags = [...tags, trimmed];
            setTags(newTags);
            updateParent(newTags);
            setInputValue("");
        }
        setIsInputVisible(false);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        if (disabled) return;
        const newTags = tags.filter(t => t !== tagToRemove);
        setTags(newTags);
        updateParent(newTags);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag();
        } else if (e.key === "Escape") {
            setIsInputVisible(false);
            setInputValue("");
        }
    };

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            {tags.map((tag) => (
                <div key={tag} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 pr-1 gap-1">
                    {tag}
                    {!disabled && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }}
                            className="text-muted-foreground hover:text-foreground rounded-full p-0.5"
                        >
                            <X className="w-3 h-3" />
                            <span className="sr-only">Remove {tag}</span>
                        </button>
                    )}
                </div>
            ))}

            {!disabled && (
                isInputVisible ? (
                    <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={handleAddTag}
                        onKeyDown={handleKeyDown}
                        className="h-6 w-24 px-2 text-xs"
                        placeholder={placeholder}
                    />
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 cursor-pointer rounded-full px-2 text-xs border border-dashed border-muted-foreground/50 hover:border-primary/50 text-muted-foreground hover:text-primary gap-1"
                        onClick={() => setIsInputVisible(true)}
                    >
                        <Plus className="w-3 h-3" />
                        Tag
                    </Button>
                )
            )}
        </div>
    );
}
