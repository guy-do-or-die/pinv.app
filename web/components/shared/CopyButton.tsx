"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
    url: string;
    iconOnly?: boolean;
    unstyled?: boolean;
}

export default function CopyButton({ url, className, children, iconOnly = false, unstyled = false, ...props }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        let success = false;
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                success = true;
            } else {
                throw new Error("Clipboard API unavailable");
            }
        } catch (err) {
            // Fallback for older browsers or non-secure contexts
            try {
                const textArea = document.createElement("textarea");
                textArea.value = url;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                success = document.execCommand('copy');
                document.body.removeChild(textArea);
            } catch (fallbackErr) {
                console.error("Failed to copy:", fallbackErr);
            }
        }

        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const Comp = (unstyled ? Button : Button) as React.ElementType;

    return (
        <Comp
            onClick={handleCopy}
            className={className}
            {...props}
        >
            {copied ? (
                <>
                    <Check className={cn("w-4 h-4 text-green-500", !iconOnly && "mr-2")} />
                    {!iconOnly && "Copied"}
                </>
            ) : (
                <>
                    <Copy className={cn("w-4 h-4", !iconOnly && "mr-2")} />
                    {!iconOnly && (children || "Copy Link")}
                </>
            )}
        </Comp>
    );
}
