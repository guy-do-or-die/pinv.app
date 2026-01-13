"use client";

import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import CopyButton from "@/components/shared/CopyButton";
import { cn } from "@/lib/utils";

interface FloatingActionsProps {
    label?: React.ReactNode;
    content: string;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    className?: string; // For positioning override if needed
}

export function FloatingActions({
    label,
    content,
    isFullscreen,
    onToggleFullscreen,
    className
}: FloatingActionsProps) {
    return (
        <div className={cn(
            "absolute top-0 right-1 flex items-center gap-1 z-10 bg-transparent p-1.5 transition-opacity",
            className
        )}>
            <div className="flex gap-1">
                {content && (
                    <CopyButton
                        url={content}
                        variant="ghost"
                        className="h-6 w-6 p-0 text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
                        iconOnly
                        unstyled
                        title="Copy"
                    >
                        <span className="sr-only">Copy</span>
                    </CopyButton>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleFullscreen}
                    className="h-6 w-6 p-0 text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                    {isFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                    ) : (
                        <Maximize2 className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
