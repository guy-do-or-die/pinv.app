"use client";

import { useState, useCallback, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { FloatingActions } from "./FloatingActions";

interface EditorPromptProps {
    prompt: string;
    setPrompt: (value: string) => void;
    isGenerating: boolean;
    isConnected: boolean;
    hasGenerated: boolean;
    error: string | null;
    onGenerate: (fromScratch?: boolean) => void;
    onBack: () => void;
}


export function EditorPrompt({
    prompt,
    setPrompt,
    isGenerating,
    isConnected,
    hasGenerated,
    error,
    onGenerate,
    onBack
}: EditorPromptProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeAction, setActiveAction] = useState<'scratch' | 'refine' | null>(null);

    useEffect(() => {
        if (!isGenerating) {
            setActiveAction(null);
        }
    }, [isGenerating]);

    const handleGenerate = (fromScratch: boolean) => {
        setActiveAction(fromScratch ? 'scratch' : 'refine');
        onGenerate(fromScratch);
    };

    // Create a portal for fullscreen mode
    const FullscreenPortal = useCallback(({ children }: { children: React.ReactNode }) => {
        if (typeof window === 'undefined') return null;
        return require('react-dom').createPortal(
            <div className="fixed inset-0 z-9999 bg-background flex flex-col h-screen w-screen">
                {children}
            </div>,
            document.body
        );
    }, []);

    const content = (
        <div className={cn(
            "relative flex flex-col bg-muted/30 overflow-hidden transition-all duration-200",
            isFullscreen ? "fixed inset-0 z-50 h-full w-full rounded-none" : "w-full rounded-none"
        )}>
            {/* Textarea Container */}
            <div className={cn(
                "relative w-full bg-transparent",
                isFullscreen ? "flex-1 h-full" : "h-[200px]"
            )}>
                <FloatingActions
                    content={prompt}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                />
                <Textarea
                    placeholder="Describe the widget you want to generate..."
                    className={cn(
                        "w-full h-full resize-none border-0 focus-visible:ring-0 p-4 font-normal leading-relaxed bg-transparent",
                        isFullscreen ? "text-lg" : "text-base"
                    )}
                    value={prompt}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                    disabled={!isConnected || isGenerating}
                />
            </div>
        </div>
    );

    return (
        <div>
            {isFullscreen ? (
                <>
                    <div className="h-[240px]" /> {/* Placeholder to prevent layout jump */}
                    <FullscreenPortal>{content}</FullscreenPortal>
                </>
            ) : content}

            <div className="flex gap-0">
                {!hasGenerated && (
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="flex-1"
                    >
                        Back
                    </Button>
                )}
                {hasGenerated ? (
                    <>
                        <Button
                            onClick={() => handleGenerate(true)}
                            disabled={isGenerating || !isConnected || !prompt.trim()}
                            isLoading={isGenerating && activeAction === 'scratch'}
                            variant="outline"
                            className="flex-1"
                            icon={Wand2}
                        >
                            BRAND NEW
                        </Button>
                        <Button
                            onClick={() => handleGenerate(false)}
                            disabled={isGenerating || !isConnected || !prompt.trim()}
                            isLoading={isGenerating && activeAction === 'refine'}
                            className="flex-1"
                            icon={Wand2}
                        >
                            REFINE
                        </Button>
                    </>
                ) : (
                    <Button
                        onClick={() => handleGenerate(false)}
                        disabled={isGenerating || !isConnected || !prompt.trim()}
                        isLoading={isGenerating}
                        className="flex-1"
                        icon={Wand2}
                    >
                        CONSTRUCT
                    </Button>
                )}
            </div>
        </div>
    );
}
