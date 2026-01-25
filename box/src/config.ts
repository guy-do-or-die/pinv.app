import { env } from "process";

export const config = {
    // Basic Server Config
    apiVersion: env.API_VERSION || "v1",
    port: parseInt(env.PORT || "5555"),
    logLevel: env.LOG_LEVEL || "info",

    // Auth & Security
    internalAuthKey: env.INTERNAL_AUTH_KEY,
    strictKeyDerivation: env.STRICT_KEY_DERIVATION === "true",
    denyPrivateNetworks: env.DENY_PRIVATE_NETWORKS !== "false", // Default true

    // Pool Configuration
    poolSize: parseInt(env.POOL_SIZE || "2"),
    maxConcurrency: parseInt(env.MAX_CONCURRENCY || "2"), // Should ideally be close to poolSize for stability
    maxQueueSize: parseInt(env.MAX_QUEUE_SIZE || "100"),
    maxQueueWaitMs: parseInt(env.MAX_QUEUE_WAIT_MS || "5000"), // 5s wait max

    // Isolate Lifecycle
    isolateMemoryLimitMb: parseInt(env.ISOLATE_MEMORY_LIMIT_MB || "128"),
    maxRunsPerIsolate: parseInt(env.MAX_RUNS_PER_ISOLATE || "1000"),
    maxIsolateAgeMs: parseInt(env.MAX_ISOLATE_AGE_MS || (60 * 60 * 1000).toString()), // 1 hour

    // Input Limits (Fail Fast)
    maxBodyBytes: parseInt(env.MAX_BODY_BYTES || "256000"), // 256KB
    maxCodeBytes: parseInt(env.MAX_CODE_BYTES || "128000"), // 128KB
    maxParamsBytes: parseInt(env.MAX_PARAMS_BYTES || "64000"), // 64KB

    // Execution Limits (Hard Stops)
    execTimeoutMs: parseInt(env.EXEC_TIMEOUT_MS || "2000"), // 2s

    // Fetch Shim Limits
    maxFetchesPerExec: parseInt(env.MAX_FETCHES_PER_EXEC || "10"),
    maxFetchBytesTotal: parseInt(env.MAX_FETCH_BYTES_TOTAL || "2000000"), // 2MB
    maxFetchBytesPerResponse: parseInt(env.MAX_FETCH_BYTES_PER_RESPONSE || "1000000"), // 1MB
    fetchTimeoutMs: parseInt(env.FETCH_TIMEOUT_MS || "2000"),

    // Output Limits
    maxLogBytesPerExec: parseInt(env.MAX_LOG_BYTES_PER_EXEC || "16000"), // 16KB
    maxResultBytes: parseInt(env.MAX_RESULT_BYTES || "256000"), // 256KB
    maxResultDepth: parseInt(env.MAX_RESULT_DEPTH || "20"),
};
