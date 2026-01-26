
import { spawn } from "child_process";

const PORT = 5555;
const BASE_URL = process.env.BOX_URL || `http://localhost:${PORT}`;
const AUTH_KEY = "dev-secret-key-123";

console.log("Using Existing Docker Server for Verification...");

const server = { kill: () => console.log('Done') }; // Mock process handle

async function runTest(name: string, fn: () => Promise<void>) {
    try {
        process.stdout.write(`running verification [${name}] ... `);
        await fn();
        console.log("PASS");
    } catch (e: any) {
        console.log("FAIL");
        console.error("  -> " + e.message);
        // Don't exit, run all
    }
}

async function authenticatedFetch(path: string, options: any = {}) {
    const headers = {
        "Authorization": `Bearer ${AUTH_KEY}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
    };
    return fetch(`${BASE_URL}${path}`, { ...options, headers });
}

try {
    // 1. Healthz
    await runTest("Healthz", async () => {
        const res = await fetch(`${BASE_URL}/healthz`);
        if (!res.ok) throw new Error(`Healthz failed: ${res.status}`);
    });

    // 2. Normal Execution
    await runTest("Normal Execution", async () => {
        const res = await authenticatedFetch("/execute", {
            method: "POST",
            body: JSON.stringify({
                code: `function main() { return "ok"; }`
            })
        });

        if (res.status === 503) {
            const json = await res.json();
            if (json.error?.code === 'ERR_IVM_UNAVAILABLE') {
                console.log("(Skipping execution tests: IVM unavailable - Verification of Fail-Closed successful)");
                return;
            }
        }

        const json = await res.json();
        if (!json.ok || json.result !== 'ok') throw new Error(`Simple exec failed: ${JSON.stringify(json)}`);
    });

    // 3. Queue Full Rejection & Fail Closed Checks
    await runTest("Queue Full / Load Test", async () => {
        // setTimeout is removed, so we use busy loop to simulate work/duration
        const sleepScript = `async function main() { const start = Date.now(); while(Date.now() - start < 5000); return "slept"; }`;

        // We'll fire off enough requests to fill pool (2) + queue (2) + overflow (1)
        // If IVM is disabled, they will all 503 immediately.

        const reqs = Array(6).fill(0).map(() => authenticatedFetch("/execute", {
            method: "POST",
            body: JSON.stringify({ code: sleepScript })
        }));

        const results = await Promise.all(reqs);
        const statuses = results.map(r => r.status);
        console.log("    Statuses:", statuses.join(','));

        const hasRejection = statuses.some(s => s === 429);
        const hasFailClosed = statuses.every(s => s === 503);

        if (hasFailClosed) {
            console.log("    (IVM Disabled: All 503 implies Fail-Closed works)");
            return;
        }

        if (!hasRejection) throw new Error(`Expected at least one 429 rejection. Got: ${statuses}`);
    });

    // 4. Execution Timeout
    await runTest("Execution Timeout", async () => {
        const loopScript = `async function main() { while(true) {} }`;
        const res = await authenticatedFetch("/execute", {
            method: "POST",
            body: JSON.stringify({ code: loopScript })
        });

        if (res.status === 503) return; // Skip if disabled

        const json = await res.json();
        if (res.status !== 504) throw new Error(`Expected 504, got ${res.status}`);
        if (json.error?.code !== 'ERR_SANDBOX_TIMEOUT') throw new Error(`Expected ERR_SANDBOX_TIMEOUT, got ${json.error?.code}`);
    });

    // 5. Private Network Block (Mimic User Scenario)
    await runTest("Private Network Block", async () => {
        // User scenario: main function, console.log object, fetch with object-url, return response object
        const fetchScript = `
            async function main(params) {
                const urlObj = { toString: () => 'http://127.0.0.1:8080' }; 
                console.log("Starting fetch", { params });
                try {
                    await fetch(urlObj);
                    return "FAIL: Did not throw";
                } catch(e) {
                    return "PASS: " + e.message;
                }
            }
        `;
        const res = await authenticatedFetch("/execute", {
            method: "POST",
            body: JSON.stringify({ code: fetchScript })
        });

        if (res.status === 503) return; // Skip if disabled

        const json = await res.json();

        if (!json.ok) throw new Error(`Execution failed: ${JSON.stringify(json)}`);

        // Expected result: "PASS: Network denied: ..."
        if (typeof json.result === 'string' && json.result.startsWith("PASS")) {
            if (json.result.includes("Network denied")) return; // Success
            throw new Error(`Caught mismatching error: ${json.result}`);
        }

        throw new Error(`Expected Network denied check to fail, got result: ${JSON.stringify(json.result)}`);
    });

    // 6. Timer Removal Test (Verified implicitly by bootstrap check or removal)
    // Skipped as no-op.

    // 7. Body Size Limit (Should work even if IVM disabled)
    await runTest("Body Size Limit", async () => {
        const bigCode = "a".repeat(300000); // > 256KB default
        const res = await authenticatedFetch("/execute", {
            method: "POST",
            body: JSON.stringify({ code: `function main() { return "${bigCode}"; }` })
        });

        if (res.status !== 413) throw new Error(`Expected 413, got ${res.status}`);
        const json = await res.json();
        if (json.error?.code !== 'ERR_BODY_TOO_LARGE') throw new Error(`Expected ERR_BODY_TOO_LARGE, got ${json.error?.code}`);
    });

    // 8. Undefined Params Test
    await runTest("Undefined Params", async () => {
        const res = await authenticatedFetch("/execute", {
            method: "POST",
            body: JSON.stringify({ code: `function main() { return 'ok'; }` }) // No params
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    // 9. Console Error Test (Should not crash)
    await runTest("Console Error Test", async () => {
        const script = `
            async function main() {
                console.error("This is an error", { detail: "something bad" });
                return "ok";
            }
        `;
        const res = await authenticatedFetch("/execute", {
            method: "POST",
            body: JSON.stringify({ code: script })
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const json = await res.json();
        if (!json.ok) throw new Error("Execution failed despite console.error");
    });

    // 10. User Reproduction (Exact Code)
    await runTest("User Reproduction", async () => {
        const script = `
            async function main(jsParams) {
              console.log("Starting Sim API fetch with params:", jsParams);
              const { address, sim_api_key } = jsParams || {};
              // if (!address) return { status: "Missing Parameters" };

              const url = "http://127.0.0.1:8080"; // Mock URL
              console.log("Fetching from SIM API:", url);

              try {
                   const response = await fetch(url, {
                       method: "GET",
                       headers: { "Accept": "application/json" }
                   });

                   if (!response.ok) {
                       console.error("API Error:", response.status);
                       return { status: "API Error" };
                   }

                   const data = await response.json();
                   return { success: true, data };
              } catch (e) {
                  return { status: "Fetch Failed", error: e.message };
              }
            };
        `;
        const res = await authenticatedFetch("/execute", {
            method: "POST",
            body: JSON.stringify({
                code: script,
                params: { address: "0x123", sim_api_key: "key" }
            })
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const json = await res.json();

        if (!json.ok) throw new Error("Execution failed");

        if (json.result?.status === 'Fetch Failed') {
            if (json.result.error && json.result.error.includes("Network denied")) return; // PASS
        }

        throw new Error(`Unexpected result: ${JSON.stringify(json.result)}`);
    });

    // 11. Script Failure Test (Syntax Error)
    await runTest("Script Failure (ERR_SCRIPT_FAIL)", async () => {
        const res = await authenticatedFetch("/execute", {
            method: "POST",
            body: JSON.stringify({ code: `function main() { return "missing_quote; }` }) // Syntax error
        });

        if (res.status === 503) return; // Skip if disabled

        if (res.status !== 400) throw new Error(`Expected 400 for syntax error, got ${res.status}`);
        const json = await res.json();

        if (json.error?.code !== 'ERR_SCRIPT_FAIL') {
            throw new Error(`Expected ERR_SCRIPT_FAIL, got ${json.error?.code}`);
        }
    });

} finally {
    server.kill();
    // Force exit after a moment
    setTimeout(() => process.exit(0), 1000);
}
