import type { ExtendedWrapper } from "../types.js";
import { config } from "../../config.js";

import ivm from "../ivm.js";

export function createHostLog(wrapper: ExtendedWrapper) {
    return new ivm.Reference((...args: any[]) => {
        if (!wrapper.job) return;

        if (wrapper.job.logBytes > config.maxLogBytesPerExec) {
            wrapper.job.logsTruncated = true;
            return;
        }

        const msg = args.map(a => {
            if (typeof a === 'object' && a !== null && typeof a.copySync === 'function') {
                try {
                    const val = a.copySync();
                    if (val instanceof Error) {
                        return `${val.name}: ${val.message}\n${val.stack}`;
                    }
                    if (typeof val === 'object') {
                        return JSON.stringify(val, null, 2);
                    }
                    return String(val);
                } catch (e) {
                    return "[Unserializable Object]";
                }
            }
            return String(a);
        }).join(" ");

        wrapper.job.logBytes += Buffer.byteLength(msg, 'utf8');

        if (wrapper.job.logBytes <= config.maxLogBytesPerExec) {
            wrapper.job.logs.push(msg);
            console.log(`[Job ${wrapper.id}]`, msg.substring(0, 200));
        }
    });
}
