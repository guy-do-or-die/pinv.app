export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly details?: any;

    constructor(code: string, message: string, statusCode: number = 500, details?: any) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export const ErrorCodes = {
    // 400 Bad Request
    ERR_NO_CODE: "ERR_NO_CODE",
    ERR_DECRYPT_FAIL: "ERR_DECRYPT_FAIL",
    ERR_PARAMS_INVALID: "ERR_PARAMS_INVALID",
    ERR_PARAMS_TOO_LARGE: "ERR_PARAMS_TOO_LARGE",
    ERR_RESULT_NOT_SERIALIZABLE: "ERR_RESULT_NOT_SERIALIZABLE",
    ERR_INVALID_JSON: "ERR_INVALID_JSON",
    ERR_SCRIPT_FAIL: "ERR_SCRIPT_FAIL",

    // 413 Payload Too Large
    ERR_BODY_TOO_LARGE: "ERR_BODY_TOO_LARGE",
    ERR_CODE_TOO_LARGE: "ERR_CODE_TOO_LARGE",

    // 429 Too Many Requests
    ERR_QUEUE_FULL: "ERR_QUEUE_FULL",
    ERR_RATE_LIMITED: "ERR_RATE_LIMITED",

    // 503 Service Unavailable / Not Ready
    ERR_NOT_READY: "ERR_NOT_READY",
    ERR_POOL_NOT_READY: "ERR_POOL_NOT_READY",
    ERR_IVM_UNAVAILABLE: "ERR_IVM_UNAVAILABLE",
    ERR_QUEUE_TIMEOUT: "ERR_QUEUE_TIMEOUT",
    ERR_KEY_DERIVATION_FAILED: "ERR_KEY_DERIVATION_FAILED",

    // 504 Gateway Timeout (Execution)
    ERR_SANDBOX_TIMEOUT: "ERR_SANDBOX_TIMEOUT",
    ERR_FETCH_TIMEOUT: "ERR_FETCH_TIMEOUT",

    // 500 Internal
    ERR_INTERNAL: "ERR_INTERNAL",
    ERR_SANDBOX_FATAL: "ERR_SANDBOX_FATAL",
    ERR_FETCH_LIMIT: "ERR_FETCH_LIMIT",
    ERR_FETCH_DENIED: "ERR_FETCH_DENIED",
};
