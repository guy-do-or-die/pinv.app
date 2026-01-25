import { getPublicKey, decrypt, isKeyReady } from "./keys.js";
import { tryUnwrapEnvelope } from "./crypto.js";
import { Hono } from "hono";
import { Sandbox } from "./sandbox";
import { IsolatePool } from "./pool.js";
import { authMiddleware } from "./auth.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { register } from "./metrics.js";
import { AppError, ErrorCodes } from "./errors.js";

const app = new Hono();
const port = config.port;

logger.info("Initializing Box Runtime (Bun + Phala SDK)...");

// Initialize Pool (Config from env)
const pool = new IsolatePool();
const sandbox = new Sandbox(pool);

// --- Standard Response Helper ---
function errorResponse(c: any, error: AppError | Error, statusOverride?: number) {
    const err = error instanceof AppError ? error : new AppError(ErrorCodes.ERR_INTERNAL, error.message, 500);
    const status = statusOverride || err.statusCode || 500;

    // Log fatal errors
    if (status >= 500) {
        logger.error({ err }, "Request Failed");
    } else {
        logger.warn({ code: err.code, msg: err.message }, "Request Rejected");
    }

    return c.json({
        ok: false,
        error: {
            code: err.code,
            message: err.message,
            details: err.details
        }
    }, status);
}

// --- Endpoints ---

app.get("/healthz", (c) => c.text("ok")); // Liveness (Process is up)

app.get("/readyz", async (c) => {
    try {
        await pool.ready; // Wait for pool init
        if (!isKeyReady()) throw new Error("Keys not ready");
        return c.text("ready");
    } catch (e: any) {
        return c.text("not ready: " + e.message, 503);
    }
});

app.get("/metrics", authMiddleware, async (c) => {
    return c.text(await register.metrics(), 200, {
        "content-type": register.contentType,
    });
});

// Expose Public Key (ECIES)
app.get("/public-key", async (c) => {
    try {
        const publicKey = await getPublicKey();
        return c.json({ ok: true, publicKey });
    } catch (e: any) {
        return errorResponse(c, e);
    }
});

// Protect execute Endpoint
app.post("/execute", authMiddleware, async (c) => {
    try {
        if (!isKeyReady()) {
            throw new AppError(ErrorCodes.ERR_NOT_READY, "Server Keys Not Ready", 503);
        }

        // 1. Pre-validation (Content-Length)
        const len = c.req.header('content-length');
        if (len && parseInt(len) > config.maxBodyBytes) {
            throw new AppError(ErrorCodes.ERR_BODY_TOO_LARGE, "Request body too large", 413);
        }

        // 2. Parse Body with Strict Limit (Stream Reading)
        let bodyBuffer: Uint8Array;
        try {
            const reader = c.req.raw.body?.getReader();
            if (!reader) throw new Error("No body stream");

            const chunks: Uint8Array[] = [];
            let receivedLength = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                if (value) {
                    receivedLength += value.length;
                    if (receivedLength > config.maxBodyBytes) {
                        throw new AppError(ErrorCodes.ERR_BODY_TOO_LARGE, "Request body exceeds limit", 413);
                    }
                    chunks.push(value);
                }
            }

            // Reassemble
            const combined = new Uint8Array(receivedLength);
            let offset = 0;
            for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
            }
            bodyBuffer = combined;

        } catch (e: any) {
            if (e instanceof AppError) throw e;
            // If manual read fails, try fallback to json() if stream wasn't consumed?
            // No, strict mode means we control the read.
            // If c.req.json() was safe we would use it, but we need streaming count.
            throw new AppError(ErrorCodes.ERR_BODY_TOO_LARGE, e.message || "Body read failed", 400);
        }

        const bodyText = new TextDecoder().decode(bodyBuffer);
        let body;
        try {
            body = JSON.parse(bodyText);
        } catch (e) {
            throw new AppError(ErrorCodes.ERR_INVALID_JSON, "Invalid JSON body", 400);
        }

        const { code, params, encryptedCode, encryptedParams, publicParams } = body;

        // 3. Resolution Logic
        let finalScript = code;
        if (!finalScript && encryptedCode) {
            try {
                finalScript = await decrypt(encryptedCode);
                logger.debug("[Box] Decrypted Code successfully.");
            } catch (e) {
                logger.error({ err: e }, "[Box] Decryption Failed");
                throw new AppError(ErrorCodes.ERR_DECRYPT_FAIL, "Code Decryption Failed", 400);
            }
        }

        // Validate Script Size
        if (finalScript && finalScript.length > config.maxCodeBytes) {
            throw new AppError(ErrorCodes.ERR_CODE_TOO_LARGE, `Code size ${finalScript.length} exceeds limit ${config.maxCodeBytes}`, 413);
        }

        let finalParams = { ...params, ...(publicParams || {}) };
        if (encryptedParams) {
            try {
                const envelopeResult = await tryUnwrapEnvelope(typeof encryptedParams === 'string' ? encryptedParams : JSON.stringify(encryptedParams));
                if (envelopeResult) {
                    finalParams = { ...finalParams, ...envelopeResult.params };

                    if (envelopeResult.code) {
                        finalScript = envelopeResult.code; // Override
                        logger.debug("[Box] Encrypted Code (from Envelope) used.");
                    }
                }
            } catch (e: any) {
                logger.error("[Box] encryptedParams failed to unwrap", e);
                throw new AppError(ErrorCodes.ERR_DECRYPT_FAIL, "Encrypted Params Decryption Failed", 400);
            }
        }

        // Validate Params Size (Check JSON string length)
        const paramsJson = JSON.stringify(finalParams);
        if (paramsJson.length > config.maxParamsBytes) {
            throw new AppError(ErrorCodes.ERR_PARAMS_TOO_LARGE, "Params size exceeds limit", 400);
        }

        if (!finalScript) {
            throw new AppError(ErrorCodes.ERR_NO_CODE, "No code provided", 400);
        }

        // 4. Execution
        const runtimeParams = { ...finalParams };
        // Clean logging - no user code in logs unless debug
        logger.info({ scriptLen: finalScript.length, paramsLen: paramsJson.length }, "Executing Script");

        const result = await sandbox.execute(finalScript, runtimeParams);

        return c.json({
            ok: true,
            result: result.result ?? null,
            meta: result.meta
        });

    } catch (e: any) {
        return errorResponse(c, e);
    }
});

import { serve } from "@hono/node-server";

logger.info(`Listening on port ${port}`);

// Node.js Server Start
if (typeof process !== "undefined" && !process.versions.bun) {
    serve({
        hostname: "0.0.0.0",
        fetch: app.fetch,
        port,
    });
}

export default {
    port,
    fetch: app.fetch,
};
