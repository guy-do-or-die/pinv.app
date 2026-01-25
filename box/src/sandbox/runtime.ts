import { config } from "../config.js";
import { AppError, ErrorCodes } from "../errors.js";
import type { ExtendedWrapper } from "./types.js";
import { BOOTSTRAP_CODE } from "./bootstrap.js";
import { createHostFetch } from "./caps/fetch.js";
import { createHostLog } from "./caps/log.js";
import { injectParams, marshalResult } from "./marshal.js";

// No longer exporting ensureInitialized - context is created per run

export async function runScriptWithTimeout(wrapper: ExtendedWrapper, script: string, params: Record<string, any>) {
    // 1. Create Fresh Context
    const context = await wrapper.isolate.createContext();
    const jail = context.global;

    // Ephemeral Runtime State
    wrapper.runtime = { context, jail };

    try {
        // Reset Job State (New state for this run)
        wrapper.job = {
            fetchCount: 0,
            fetchBytes: 0,
            logBytes: 0,
            logsTruncated: false,
            deadlineMs: Date.now() + config.execTimeoutMs
        };

        // 2. Setup Global Reference
        await jail.set("global", jail.derefInto());

        // 3. Install Host Capabilities
        await jail.set("hostFetch", createHostFetch(wrapper));
        await jail.set("hostLog", createHostLog(wrapper));

        // 4. Eval Bootstrap (Shims)
        await context.evalClosure(BOOTSTRAP_CODE, []);

        // 5. Inject Params
        await injectParams(jail, params);

        // 6. Prepare Script
        // We do NOT rewrite 'export default'. We expect the user code to Define 'main' or set variables.
        // Users should use: `function main(params) { ... }` or `globalThis.main = ...`
        const finalScript = `
            (async () => {
                ${script}
                
                let result;
                if (typeof main === 'function') {
                    result = await main(jsParams);
                } else if (typeof default_export !== 'undefined') {
                     // Fallback if they defined a global 'default_export' manually
                     if (typeof default_export === 'function') {
                         result = await default_export(jsParams);
                     } else {
                         result = default_export;
                     }
                } else {
                    result = undefined;
                }

                if (result === undefined) return undefined;
                try {
                    return JSON.stringify(result);
                } catch (e) {
                    throw new Error("Execution Result is not serializable (Circular structure or BigInt?)");
                }
            })()
        `;

        // 7. Compile & Run
        // Note: We compile in the *isolate*, but run in the *context*.
        // Script lifecycle is tied to isolate, but here we compile per run for simplicity/isolation
        // (Optimization: Cache compiled scripts by hash? Out of scope for now)
        const scriptHandle = await wrapper.isolate.compileScript(finalScript);

        // Execution Race
        const executionPromise = scriptHandle.run(context, { promise: true });

        let resultRef;
        let didTimeout = false;

        try {
            resultRef = await Promise.race([
                executionPromise,
                new Promise((_, reject) => setTimeout(() => {
                    didTimeout = true;
                    reject(new AppError(ErrorCodes.ERR_SANDBOX_TIMEOUT, "Execution Timed Out", 504));
                }, config.execTimeoutMs))
            ]);
        } catch (err: any) {
            if (didTimeout) {
                // If timeout, we first try to hard-terminate the execution (best effort)
                // We do NOT dispose here; proper cleanup happens via pool.release() when we throw
                if (typeof (wrapper.isolate as any).terminateExecution === 'function') {
                    try { (wrapper.isolate as any).terminateExecution(); } catch (e) { /* ignore */ }
                }

                throw new AppError(ErrorCodes.ERR_SANDBOX_TIMEOUT, "Execution Timed Out", 504);
            }
            throw err;
        }

        return await marshalResult(resultRef);

    } finally {
        // ALWAYS Cleanup Context
        try {
            context.release();
        } catch (e) { /* ignore */ }
        wrapper.runtime = undefined; // Clear runtime ref from wrapper
        wrapper.job = undefined;     // Clear job state
    }
}
