'use client';

import { sdk } from '@farcaster/miniapp-sdk';
import { useCallback } from 'react';

interface ShareButtonProps {
    url: string;
}

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export default function ShareButton({ url }: ShareButtonProps) {
    const handleShare = useCallback(async () => {
        try {
            await sdk.actions.composeCast({
                text: "Here’s my PinV 👇",
                embeds: [url],
            });
        } catch (error) {
            console.error('Error sharing:', error);
            // Fallback for non-miniapp context or error
            if (typeof window !== 'undefined') {
                window.open(`https://warpcast.com/~/compose?text=Here’s my PinV 👇&embeds[]=${encodeURIComponent(url)}`, '_blank');
            }
        }
    }, [url]);

    return (
        <Button
            onClick={handleShare}
            className="flex-1 bg-white text-black hover:bg-white/90 font-bold"
        >
            <Share2 className="w-4 h-4 mr-2" />
            Share my PinV
        </Button>
    );
}
