import React, { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FloatingActions } from "./FloatingActions";

import { LogEntry } from "@/hooks/useDataCodeRunner";

interface EditorLogsProps {
    logs: LogEntry[];
    lastRunTime?: Date | null;
}

export function EditorLogs({ logs, lastRunTime }: EditorLogsProps) {
    const fullLog = logs.map(l => `[${l.timestamp}] ${(l.level || 'info').toUpperCase()}: ${l.message || ''}`).join("\n");
    const timeString = lastRunTime ? lastRunTime.toLocaleTimeString() : "--:--:--";
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
            "relative flex flex-col border border-border bg-muted/20 overflow-hidden transition-all duration-200",
            isFullscreen ? "fixed inset-0 z-50 h-full w-full rounded-none border-0 mt-0" : "rounded-md"
        )}>
            {/* Floating Actions */}
            <FloatingActions
                label={`Updated ${timeString}`}
                content={fullLog}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            />

            {/* Logs Content - Terminal Style */}
            <div className={cn(
                "relative group flex-1 overflow-hidden flex flex-col",
                isFullscreen ? "h-full" : "max-h-[300px]"
            )}>
                {logs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm font-mono italic select-none">
                        No output to display. Run code to generate logs.
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs md:text-sm bg-muted/50 text-foreground select-text rounded-b-md">
                        {logs.map((log, i) => (
                            <div
                                key={i}
                                className="whitespace-pre-wrap break-all border-b border-border/50 py-0.5 last:border-0"
                            >
                                <span className="opacity-50 mr-2 select-none">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={cn(
                                    "font-bold mr-2",
                                    log.level === 'error' ? "text-red-500" :
                                        log.level === 'warn' ? "text-yellow-500" :
                                            "text-blue-500"
                                )}>
                                    [{(log.level || 'info').toUpperCase()}]
                                </span>
                                <span>{log.message}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    if (isFullscreen) {
        return (
            <>
                <div className="h-[300px]" /> {/* Placeholder to prevent layout jump */}
                <FullscreenPortal>{content}</FullscreenPortal>
            </>
        );
    }

    return content;
}
