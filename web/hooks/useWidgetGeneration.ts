"use client";

import { useState, useCallback } from "react";

export interface GenerationResult {
    title?: string;
    tagline?: string;
    dataCode: string;
    uiCode: string;
    parameters: Array<{
        name: string;
        type: "user_setting" | "dynamic_context";
        description?: string;
    }>;
    previewData: Record<string, unknown>;
}

interface UseWidgetGenerationReturn {
    generate: (prompt: string, contextParams?: any) => Promise<GenerationResult | null>;
    isGenerating: boolean;
    result: GenerationResult | null;
    error: string | null;
    reset: () => void;
}

/**
 * Hook for AI-powered widget generation.
 * Handles the API call to /api/generate and parses the response.
 * 
 * @example
 * ```tsx
 * const { generate, isGenerating, result, error } = useWidgetGeneration();
 * 
 * const handleSubmit = async () => {
 *   const generated = await generate("Show ETH price");
 *   if (generated) {
 *     // Use generated.dataCode, generated.uiCode, etc.
 *   }
 * };
 * ```
 */
export function useWidgetGeneration(): UseWidgetGenerationReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(async (prompt: string, contextParams?: any): Promise<GenerationResult | null> => {
        if (!prompt.trim()) {
            setError("Prompt is required");
            return null;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, contextParams }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Generation failed (${response.status})`);
            }

            const data = await response.json();

            const generationResult: GenerationResult = {
                title: data.title,
                tagline: data.tagline,
                dataCode: data.data_code || "",
                uiCode: data.ui_code || "",
                parameters: (data.parameters || []).map((p: any) => ({ ...p, hidden: true })),
                previewData: data.preview_data || {},
            };

            setResult(generationResult);
            return generationResult;

        } catch (err) {
            const message = err instanceof Error ? err.message : "Generation failed";
            setError(message);
            console.error("Widget generation failed:", err);
            return null;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return {
        generate,
        isGenerating,
        result,
        error,
        reset,
    };
}
