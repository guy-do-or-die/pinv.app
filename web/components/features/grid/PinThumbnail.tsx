"use client";

import { useState } from "react";
import { Loader } from "@/components/shared/Loader";
import { cn } from "@/lib/utils";

interface PinThumbnailProps {
    src: string;
    alt: string;
    className?: string;
}

export default function PinThumbnail({ src, alt, className }: PinThumbnailProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className="relative w-full h-full">
            <img
                src={src}
                alt={alt}
                className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-all duration-500",
                    isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
                    className
                )}
                onLoad={() => setIsLoaded(true)}
            />
            {!isLoaded && (
                <Loader variant="thumbnail" />
            )}
        </div>
    );
}
