"use client";

import { useEffect } from "react";
import { Buffer } from "buffer";

export default function Polyfills() {
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (!window.Buffer) {
                window.Buffer = Buffer;
            }
        }
    }, []);

    return null;
}
