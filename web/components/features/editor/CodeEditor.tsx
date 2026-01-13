"use client";

import { useState, useCallback, useEffect } from "react";
import Editor from "react-simple-code-editor";
import { Highlight, themes } from "prism-react-renderer";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import CopyButton from "@/components/shared/CopyButton";
import { FloatingActions } from "./partials/FloatingActions";

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: "javascript" | "jsx" | "typescript" | "tsx";
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

/**
 * Lightweight code editor with syntax highlighting.
 * Uses react-simple-code-editor + prism-react-renderer.
 * 
 * Features:
 * - Syntax highlighting for JS/JSX
 * - Fullscreen toggle
 * - Dark theme
 */
export default function CodeEditor({
    value,
    onChange,
    language = "javascript",
    placeholder = "Enter code...",
    className,
    minHeight = "500px",
    height = "500px", // Explicit height prop
}: CodeEditorProps & { height?: string }) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const currentTheme = mounted && resolvedTheme === "light" ? themes.vsLight : themes.vsDark;

    const highlightCode = useCallback((code: string) => (
        <Highlight
            theme={currentTheme}
            code={code}
            language={language}
        >
            {({ tokens, getLineProps, getTokenProps }) => (
                <>
                    {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })}>
                            {line.map((token, key) => (
                                <span key={key} {...getTokenProps({ token })} />
                            ))}
                        </div>
                    ))}
                </>
            )}
        </Highlight>
    ), [language, currentTheme]);

    // Create a portal for fullscreen mode to break out of stacking contexts
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
            "relative overflow-hidden flex flex-col code-editor-wrapper", // Added wrapper class for scoping
            // Fixed height logic:
            // If fullscreen: fixed inset-0
            // If normal: h-[500px] (explicit fixed height)
            isFullscreen
                ? "fixed inset-0 z-50 bg-background"
                : cn("h-[500px] border border-t-0 border-border bg-background", className),
            // Remove rounding to close gaps with tabs
            "rounded-none"
        )}>
            <FloatingActions
                label={language}
                content={value}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                className="z-50"
            />

            {/* Editor Container - Scrollable */}
            <div className="flex-1 overflow-auto relative bg-background w-full">
                <div className="min-w-fit min-h-full">
                    <Editor
                        value={value}
                        onValueChange={onChange}
                        highlight={highlightCode}
                        padding={16}
                        placeholder={placeholder}
                        style={{
                            fontFamily: '"Fira Code", "Fira Mono", monospace',
                            fontSize: 14,
                            backgroundColor: "transparent",
                            minHeight: "100%", // Fill container
                        }}
                        textareaClassName="focus:outline-none"
                        className="min-h-full font-mono tracking-tight"
                    />
                </div>
            </div>

            {/* Global style override, scoped to this editor wrapper to prevent side effects */}
            <style jsx global>{`
                .code-editor-wrapper .prism-editor-textarea {
                     white-space: pre !important; 
                     overflow-wrap: normal !important;
                }
                .code-editor-wrapper pre {
                     white-space: pre !important; 
                     overflow-wrap: normal !important;
                }
            `}</style>
        </div>
    );

    if (isFullscreen) {
        return (
            <>
                <div style={{ height }} /> {/* Placeholder to prevent layout jump */}
                <FullscreenPortal>{content}</FullscreenPortal>
            </>
        );
    }

    return content;
}
