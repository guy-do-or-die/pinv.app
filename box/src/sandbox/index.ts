import { IsolatePool } from "../pool.js";
import { AppError, ErrorCodes } from "../errors.js";
import { metrics } from "../metrics.js";
import type { ExtendedWrapper } from "./types.js";
import { runScriptWithTimeout } from "./runtime.js";

export interface ExecutionResult {
    ok: boolean;
    result?: any;
    error?: any;
    meta: {
        durationMs: number;
        fetchCount: number;
        fetchBytes: number;
        logBytes: number;
        logsTruncated: boolean;
    };
}

export class Sandbox {
    private pool: IsolatePool;

    constructor(pool: IsolatePool) {
        this.pool = pool;
    }

    async execute(script: string, params: Record<string, any>): Promise<ExecutionResult> {
        let wrapper: ExtendedWrapper | null = null;
        const start = Date.now();

        try {
            // 1. Acquire
            wrapper = await this.pool.acquire() as ExtendedWrapper;

            // 2. Run (Runtime handles fresh context init/cleanup)
            const result = await runScriptWithTimeout(wrapper, script, params);

            // 3. Success stats
            metrics.executionDuration.observe((Date.now() - start) / 1000);
            metrics.executionsTotal.inc({ status: "success", code: "OK" });

            const meta = {
                durationMs: Date.now() - start,
                fetchCount: wrapper.job?.fetchCount || 0,
                fetchBytes: wrapper.job?.fetchBytes || 0,
                logsTruncated: wrapper.job?.logsTruncated || false,
                logBytes: wrapper.job?.logBytes || 0
            };

            // 4. Release (Clean return)
            await this.pool.release(wrapper);
            wrapper = null;

            return { ok: true, result, meta };

        } catch (e: any) {
            console.error("[Sandbox] Execution Fatal Error:", e);
            metrics.executionDuration.observe((Date.now() - start) / 1000);
            metrics.executionsTotal.inc({ status: "error", code: e.code || "ERR_UNKNOWN" });

            // Determine if fatal (timeout/poison)
            let poisonReason = "error_execution";
            if (e.code === ErrorCodes.ERR_SANDBOX_TIMEOUT) poisonReason = "timeout";

            // If we have a wrapper, release it with poison
            if (wrapper) {
                // If the error was a timeout or something that ruined state, we enforce disposal
                // The pool handles disposal if a poison reason is provided
                await this.pool.release(wrapper, poisonReason);
            }

            if (e instanceof AppError) throw e;
            throw new AppError(ErrorCodes.ERR_SANDBOX_FATAL, e.message || "Execution Failed", 500);
        }
    }
}
