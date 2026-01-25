import { AppError, ErrorCodes } from "../errors.js";
import { config } from "../config.js";
import ivm from "./ivm.js";

// ivm is now guaranteed to be loaded by pool init before this code runs
// (or the pool fails to start).

export async function injectParams(jail: any, params: Record<string, any>) {
    // if (!ivm) await loadMarshallingDependencies(); -> Removed
    try {
        const paramsCopy = new ivm.ExternalCopy(params);
        await jail.set("jsParams", paramsCopy.copyInto());
    } catch (e) {
        console.error("[Sandbox] Error injecting params:", e);
        throw new AppError(ErrorCodes.ERR_INTERNAL, "Failed to inject parameters", 500);
    }
}

export async function marshalResult(resultRef: any): Promise<any> {
    let result;
    try {
        // We expect a String (JSON) or undefined/null/primitive from the script wrapper.
        // If it returned a Reference (unlikely with stringify), copy it.
        if (typeof resultRef === 'object' && resultRef !== null && typeof resultRef.copy === 'function') {
            const copied = await resultRef.copy();
            result = typeof copied === 'string' ? JSON.parse(copied) : copied;
        } else if (typeof resultRef === 'string') {
            result = JSON.parse(resultRef);
        } else {
            result = resultRef;
        }
    } catch (e) {
        console.error("[Sandbox] Result Copy/Parse Error:", e);
        throw new AppError(ErrorCodes.ERR_RESULT_NOT_SERIALIZABLE, "Result copy failed (too large or non-serializable)");
    }

    // Depth Check (BFS)
    if (result && typeof result === 'object') {
        const queue = [{ val: result, depth: 0 }];
        const maxDepth = config.maxResultDepth || 20;

        while (queue.length > 0) {
            const { val, depth } = queue.shift()!;
            if (depth > maxDepth) {
                throw new AppError(ErrorCodes.ERR_RESULT_NOT_SERIALIZABLE, "Result depth exceeds limit", 500);
            }
            if (val && typeof val === 'object') {
                for (const key in val) {
                    if (Object.prototype.hasOwnProperty.call(val, key)) {
                        queue.push({ val: val[key], depth: depth + 1 });
                    }
                }
            }
        }
    }

    // Byte Length Check
    const resultJson = JSON.stringify(result);
    if (resultJson && Buffer.byteLength(resultJson) > config.maxResultBytes) {
        throw new AppError(ErrorCodes.ERR_RESULT_NOT_SERIALIZABLE, "Result too large", 500);
    }

    return result;
}
