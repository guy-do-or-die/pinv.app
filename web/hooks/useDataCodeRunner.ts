"use client";

import { useState, useCallback } from "react";

export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
}

interface UseDataCodeRunnerReturn {
    run: (dataCode: string, params: Record<string, unknown>, uiCode?: string, encryptedParams?: string | null) => Promise<Record<string, unknown> | null>;
    isRunning: boolean;
    result: Record<string, unknown> | null;
    image: string | null;
    error: string | null;
    logs: LogEntry[];
}

/**
 * Hook for executing data code + generating preview image.
 * Uses Unified /og/preview endpoint.
 */
export function useDataCodeRunner(): UseDataCodeRunnerReturn {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<Record<string, unknown> | null>(null);
    const [image, setImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const run = useCallback(async (
        dataCode: string,
        params: Record<string, unknown>,
        uiCode?: string,
        encryptedParams?: string | null // New
    ): Promise<Record<string, unknown> | null> => {
        // Allow empty dataCode if uiCode is present (pure UI preview)
        if (!dataCode.trim() && !uiCode?.trim()) {
            setError("No code provided");
            return null;
        }

        setIsRunning(true);
        setError(null);
        setLogs([]);
        // Do not clear image immediately to prevent flickering? 
        // Or clear it to show loading? User disliked "blinking", so maybe keep old image until new one arrives?
        // Let's keep old image for smoothness.

        try {
            // Proxy via Next.js Rewrite to /og/preview
            const response = await fetch('/og/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataCode, params, uiCode, encryptedParams })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.details || `Execution failed with status ${response.status}`);
            }

            const data = await response.json();

            // Set logs from server
            if (Array.isArray(data.logs)) {
                setLogs(data.logs.map((logMsg: any) => {
                    // Handle if backend ever sends objects, otherwise treat as string
                    if (typeof logMsg === 'object' && logMsg !== null) {
                        return {
                            timestamp: logMsg.timestamp || new Date().toISOString(),
                            level: logMsg.level || 'info',
                            message: logMsg.message || JSON.stringify(logMsg)
                        };
                    }
                    const strMsg = String(logMsg);
                    const lowerMsg = strMsg.toLowerCase();
                    const isError = lowerMsg.includes('error') || lowerMsg.includes('fail') || lowerMsg.includes('missing') || lowerMsg.includes('exception');
                    return {
                        timestamp: new Date().toISOString(),
                        level: isError ? 'error' : 'info',
                        message: strMsg
                    };
                }));
            }

            if (data.image) {
                setImage(`data:image/png;base64,${data.image}`);
            }

            if (data.result) {
                setResult(data.result);
                return data.result;
            }

            return null;

        } catch (err: any) {
            const errorMessage = err.message || "Unknown error occurred";
            setError(errorMessage);
            setLogs(prev => [...prev, {
                timestamp: new Date().toISOString(),
                level: 'error',
                message: errorMessage
            }]);
            return null;
        } finally {
            setIsRunning(false);
        }
    }, []);

    return {
        run,
        isRunning,
        result,
        image,
        error,
        logs,
    };
}
