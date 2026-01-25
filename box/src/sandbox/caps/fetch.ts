import type { ExtendedWrapper } from "../types.js";
import { config } from "../../config.js";
import { validateUrl } from "../../utils.js";
import ivm from "../ivm.js";

export function createHostFetch(wrapper: ExtendedWrapper) {
    // Accepts a single JSON string argument 
    return new ivm.Reference(async (argsJson: any) => {
        if (!wrapper.job) return JSON.stringify({ error: "No active job state" });

        let args;
        try {
            args = JSON.parse(argsJson);
        } catch (e) {
            return JSON.stringify({ error: "Invalid hostFetch args" });
        }
        const { url: urlArg, options: optionsArg } = args;

        try {
            if (wrapper.job.fetchCount >= config.maxFetchesPerExec) {
                return JSON.stringify({ error: "Fetch limit exceeded" });
            }

            const url = String(urlArg);
            const validationError = await validateUrl(url);
            if (validationError) {
                return JSON.stringify({ error: `Network denied: ${validationError}` });
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.fetchTimeoutMs);

            try {
                wrapper.job.fetchCount++;
                const res = await fetch(url, { ...optionsArg, signal: controller.signal });

                const lenHeader = res.headers.get("content-length");
                if (lenHeader && parseInt(lenHeader) > config.maxFetchBytesPerResponse) {
                    return JSON.stringify({ error: "Response content-length exceeds limit" });
                }

                if (!res.body) {
                    return JSON.stringify({
                        ok: res.ok,
                        status: res.status,
                        statusText: res.statusText,
                        text: ""
                    });
                }

                const reader = res.body.getReader();
                const chunks: Uint8Array[] = [];
                let receivedLength = 0;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    if (value) {
                        // Check Limit
                        receivedLength += value.length;
                        if (receivedLength > config.maxFetchBytesPerResponse) {
                            controller.abort(); // Kill connection
                            return JSON.stringify({ error: "Response size exceeds limit" });
                        }

                        // Check Total Budget
                        if ((wrapper.job.fetchBytes + value.length) > config.maxFetchBytesTotal) {
                            controller.abort();
                            return JSON.stringify({ error: "Total fetch bytes exceeded" });
                        }

                        chunks.push(value);
                    }
                }

                // Update Total Budget (Safe now)
                wrapper.job.fetchBytes += receivedLength;

                // Concatenate
                const bodyBuffer = new Uint8Array(receivedLength);
                let offset = 0;
                for (const chunk of chunks) {
                    bodyBuffer.set(chunk, offset);
                    offset += chunk.length;
                }
                const bodyText = new TextDecoder().decode(bodyBuffer);

                return JSON.stringify({
                    ok: res.ok,
                    status: res.status,
                    statusText: res.statusText,
                    text: bodyText
                });

            } finally {
                clearTimeout(timeoutId);
            }
        } catch (e: any) {
            return JSON.stringify({ error: e.message || "Fetch failed" });
        }
    });
}
