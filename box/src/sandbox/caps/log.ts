import type { ExtendedWrapper } from "../types.js";
import { config } from "../../config.js";

import ivm from "../ivm.js";

export function createHostLog(wrapper: ExtendedWrapper) {
    return new ivm.Reference((...args: any[]) => {
        if (!wrapper.job) return; // Should not happen in active run

        if (wrapper.job.logBytes > config.maxLogBytesPerExec) {
            wrapper.job.logsTruncated = true;
            return; // Drop
        }

        const msg = args.map(a => String(a)).join(" ");
        wrapper.job.logBytes += Buffer.byteLength(msg, 'utf8'); // Correct usage: byte length

        if (wrapper.job.logBytes <= config.maxLogBytesPerExec) {
            console.log(`[Job ${wrapper.id}]`, msg.substring(0, 200));
        }
    });
}
