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
                        <Card className="h-full flex flex-col p-0 border-x-0 md:border-x transition-all duration-300 md:hover:-translate-y-1 md:hover:shadow-xl">
                            {/* Header */}
                            <div className="flex justify-between items-start p-6 pb-4">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold font-orbitron text-foreground md:group-hover:text-primary transition-colors truncate pr-4">
                                        {pin.title}
                                    </h2>
                                </div>
                                <div className="px-2 py-1 bg-muted/20 border border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground rounded-sm">
                                    V1.0
                                </div>
                            </div>

                            {/* Preview Window (Data Enclave) */}
                            <DataEnclave className="w-full aspect-3/2 p-0 overflow-hidden md:group-hover:border-primary/30 transition-colors border-y border-transparent relative">
                                {/* Background Image */}
                                <PinThumbnail
                                    src={buildOgUrl(pin.id, {}, true, pin)}
                                    alt={pin.title}
                                    className="md:group-hover:scale-105"
                                />
                            </DataEnclave>

                            {/* Footer */}
                            <div className="mt-auto mx-6 border-t border-dashed border-border py-4 flex justify-between items-center">
                                <span className="text-xs font-mono text-muted-foreground">
                                    {pin.tagline}
                                </span>
                                <ArrowRight className="w-4 h-4 text-muted-foreground md:group-hover:text-primary md:group-hover:translate-x-1 transition-all" />
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
