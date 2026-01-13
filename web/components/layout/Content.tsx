import { cn } from "@/lib/utils";
import React from "react";

interface ContentProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Content - Standard page layout shell.
 * Includes background pattern, container centering, and consistent padding.
 */
export default function Content({ children, className }: ContentProps) {
    return (
        <div className="min-h-screen bg-background pattern-grid pt-8">
            <div className="app-container">
                <main className={cn("mt-4 md:mt-8 w-full max-w-7xl mx-auto", className)}>
                    {children}
                </main>
            </div>
        </div>
    );
}
