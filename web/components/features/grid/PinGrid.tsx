"use client";

import { usePins } from "@/hooks/usePins";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

import { ArrowRight, Zap, Loader2 } from "lucide-react";

import { Pin } from "@/types";
import { Card } from "@/components/ui/card";
import { DataEnclave } from "@/components/shared/DataEnclave";
import { buildOgUrl } from "@/lib/services/preview";

import PinThumbnail from "./PinThumbnail";

interface PinGridProps {
    initialPins: Pin[];
}

export default function PinGrid({ initialPins }: PinGridProps) {
    // Merge initialPins with hook state if needed, or just rely on hook for now
    // Since we are refactoring to client-side fetching as primary for this task:
    const { pins, hasMore, loadMore, isLoading } = usePins();

    // Trigger initial load if no pins (or if we want to fetch updates)
    // Trigger initial load if no pins
    useEffect(() => {
        if (pins.length === 0 && !isLoading && hasMore) {
            loadMore();
        }
    }, [pins.length, isLoading, hasMore, loadMore]);

    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isLoading) return;

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        });

        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current);
        }

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [loadMore, hasMore, isLoading]);

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {pins.map((pin) => (
                    <Link href={`/p/${pin.id}`} key={pin.id} className="block group h-full">
                        <Card className="h-full flex flex-col p-0 transition-all duration-300 hover:shadow-lg border-muted/40 overflow-hidden bg-card/50 hover:bg-card">
                            {/* Header */}
                            <div className="flex justify-between items-start p-5 pb-3">
                                <div className="space-y-1 min-w-0">
                                    <h2 className="text-lg font-bold font-orbitron text-foreground md:group-hover:text-primary transition-colors truncate pr-2">
                                        {pin.title}
                                    </h2>
                                </div>
                                <div className="shrink-0 px-2 py-0.5 bg-muted/30 text-[10px] font-mono font-medium text-muted-foreground rounded-full">
                                    {`v${pin.version || '1'}`}
                                </div>
                            </div>

                            {/* Preview Window (Data Enclave) */}
                            <DataEnclave className="w-full aspect-3/2 p-0 overflow-hidden relative bg-muted/10">
                                {/* Background Image */}
                                <PinThumbnail
                                    src={buildOgUrl(pin.id, {}, false, pin)}
                                    alt={pin.title}
                                    className="object-cover w-full h-full transition-transform duration-500 md:group-hover:scale-105"
                                />
                            </DataEnclave>

                            {/* Footer */}
                            <div className="mt-auto px-5 py-4 flex justify-between items-center bg-transparent">
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                    {pin.tagline || "No description provided."}
                                </p>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Infinite Scroll Sentinel & Loader */}
            {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm font-mono tracking-widest uppercase">Loading...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
