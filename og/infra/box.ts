
// Configuration
const BOX_URL = process.env.BOX_URL || "http://localhost:8080";
const INTERNAL_AUTH_KEY = process.env.INTERNAL_AUTH_KEY;

interface BoxPayload {
    encryptedCode?: string;
    encryptedParams?: string;
    publicParams?: Record<string, any>;
    // Plaintext code (if not encrypted)
    code?: string;
}

export async function executeBoxAction(
    payload: BoxPayload
): Promise<{ result: Record<string, unknown> | null, logs: string[] }> {

    // 1. Validation
    if (!payload.encryptedCode && !payload.code) {
        console.warn("[BoxExecutor] No code provided (encrypted or plaintext)");
        return { result: {}, logs: [] };
    }

    if (!INTERNAL_AUTH_KEY) {
        // We warn but proceed, relying on the Box to act (e.g. Dev Mode)
        console.warn("[BoxExecutor] No INTERNAL_AUTH_KEY configured in OG. Box request likely to fail if Box expects auth.");
    }

    // 2. Prepare Params (Normalization similar to Lit)
    // We only normalize publicParams here. Encrypted params are opaque strings.
    const jsParams: Record<string, any> = {};
    if (payload.publicParams) {
        for (const [k, v] of Object.entries(payload.publicParams)) {
            try {
                if (typeof v === 'string' && (v.startsWith('{') || v.startsWith('[') || v === 'true' || v === 'false' || !isNaN(Number(v)))) {
                    jsParams[k] = JSON.parse(v);
                } else {
                    jsParams[k] = v;
                }
            } catch {
                jsParams[k] = v;
            }
        }
    }

    try {
        console.log(`[BoxExecutor] Calling Box at ${BOX_URL}...`);

        // 3. Execute
        const response = await fetch(`${BOX_URL}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${INTERNAL_AUTH_KEY}`
            },
            body: JSON.stringify({
                encryptedCode: payload.encryptedCode,
                encryptedParams: payload.encryptedParams,
                publicParams: jsParams,
                code: payload.code
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Box Error (${response.status}): ${errText}`);
        }

        const data = await response.json();

        // 4. Parse Result
        // Box returns { status: "executed", result: ... }
        // We expect result to be the return value of the script.
        const result = data.result;

        // Box currently doesn't capture console.log (it prints to stdout).
        // Future optimization: Box should capture logs and return them.
        const logs: string[] = ["[Box] Execution Successful"];

        console.log('[BoxExecutor] Result:', result);

        return { result, logs };

    } catch (e: any) {
        console.error('[BoxExecutor] Failed:', e);
        return {
            result: null,
            logs: [`[Box Error] ${e.message}`]
        };
    }
}
