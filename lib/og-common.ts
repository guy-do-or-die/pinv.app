
export interface NormalizedParams {
    [key: string]: string;
}

export interface EncryptedParam {
    ciphertext: string;
    dataToEncryptHash: string;
    accessControlConditions: any[];
}

export function isEncryptedParam(val: any): val is EncryptedParam {
    return val &&
        typeof val === 'object' &&
        typeof val.ciphertext === 'string' &&
        typeof val.dataToEncryptHash === 'string' &&
        Array.isArray(val.accessControlConditions);
}

export interface Bundle {
    ver?: string; // manifest CID
    params?: NormalizedParams;
    ts?: number; // timestamp in seconds
}

// Canonicalize params logic
export function canonicalizeParams(input: any): NormalizedParams {
    const output: NormalizedParams = {};
    if (!input || typeof input !== 'object') return output;

    const keys = Object.keys(input).sort();

    keys.forEach(key => {
        const val = input[key];
        if (val === undefined || val === null) return;

        if (typeof val === 'string') {
            output[key] = val.trim();
        } else {
            // Force everything to string for simplicity and consistency
            output[key] = String(val).trim();
        }
    });

    return output;
}

export function computeParamsHash(params: NormalizedParams): string {
    const sortedKeys = Object.keys(params).sort();
    const sortedObj: Record<string, string> = {};
    for (const key of sortedKeys) {
        sortedObj[key] = params[key];
    }
    return JSON.stringify(sortedObj);
}
