"use client";

import PinDisplayCard from "@/components/features/viewer/PinDisplayCard";
import { Button } from "@/components/ui/button";
import { Play, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorPreviewProps {
    previewImageUrl: string | null;
    isLoading: boolean;
    hasGenerated: boolean;
    isDataCodeRunning: boolean;
    onBack: () => void;
    onUpdate: () => void;
    onSave: () => void;
}

export function EditorPreview({
    previewImageUrl,
    isLoading,
    hasGenerated,
    isDataCodeRunning,
    onBack,
    onUpdate,
    onSave
}: EditorPreviewProps) {
    return (
        <div className={cn(
            "flex flex-col gap-4 sticky top-24 min-w-0"
        )}>
            <PinDisplayCard
                title="Preview"
                description={null}
                imageSrc={previewImageUrl}
                isLoading={isLoading}
                placeholderText="Initialize module to visualise data."
                className="h-fit border-none shadow-none bg-transparent"
            >
                <div className={cn(
                    "items-center pt-4 border-t border-dashed border-border mt-2 w-full gap-2 md:gap-4",
                    hasGenerated ? "grid grid-cols-3" : "flex"
                )}>
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="text-muted-foreground hover:text-primary w-full"
                    >
                        Back
                    </Button>
                    {hasGenerated && (
                        <>
                            <Button
                                variant="secondary"
                                onClick={onUpdate}
                                disabled={isDataCodeRunning || isLoading}
                                isLoading={isLoading}
                                icon={Play}
                                className="w-full"
                            >
                                Update
                            </Button>
                            <Button
                                onClick={onSave}
                                disabled={!hasGenerated}
                                icon={Save}
                                className="w-full"
                            >
                                Save
                            </Button>
                        </>
                    )}
                </div>
            </PinDisplayCard>
        </div>
    );
}
