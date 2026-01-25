import { fetch, file } from "bun";
import { readFileSync } from "fs";

// Configuration
const OG_URL = "http://localhost:8080/og/preview";
const TEMPLATE_PATH = "lib/pin-lit-action.ts";
const USER_LOGIC_PATH = "scripts/user_logic.js";

const API_KEYS = [
    "sim_42PmaKr7xKEjfMvTbDg7Fq08ektwXzIV",
    "sim_64KXDoZoqO2HDd2JIEAaUVBFVTwJT105"
];

const ADDRESS = "0x830bc5551e429DDbc4E9Ac78436f8Bf13Eca8434";

// Helper to extract template string from TS file (hacky but works for script)
function getTemplate() {
    const content = readFileSync(TEMPLATE_PATH, "utf-8");
    // Extract content between `const LIT_ACTION_TEMPLATE = \`` and `\`;`
    const match = content.match(/const LIT_ACTION_TEMPLATE = `([\s\S]*?)`;/);
    if (!match) throw new Error("Could not find LIT_ACTION_TEMPLATE in " + TEMPLATE_PATH);

    // Unescape the raw source to get the actual string value
    // 1. Replace `\` followed by `` ` `` with just `` ` ``
    // 2. Replace `\` followed by `${` with just `${`
    // 3. Replace `\` followed by `\` with `\` (if any, though less likely in this simple template)
    return match[1]
        .replace(/\\`/g, '`')
        .replace(/\\\${/g, '${');
}

async function runTest() {
    console.log("Starting Reproduction Test Loop...");

    const template = getTemplate();
    const userLogic = readFileSync(USER_LOGIC_PATH, "utf-8");
    const fullCode = template.replace('USER_CODE_INJECTION_POINT', userLogic);

    // Verify fix details
    // console.log("Code Preview:\n", fullCode.slice(-500));

    // CRITICAL: The executor.ts WRAPS the code with a runner if we send `dataCode`.
    // But our template ALSO has a runner at the bottom.
    // This causes Double Execution and Race Conditions (hanging the script).
    // We must STRIP the runner from the template for this test to work via `og/preview`.
    const cleanCode = fullCode.replace(/\/\/ Execute[\s\S]*main\(\)[\s\S]*\.catch\(\(e\) => \{[\s\S]*\}\);/g, '');

    // console.log("Cleaned Code Length:", cleanCode.length);

    for (let i = 0; i < 4; i++) {
        const key = API_KEYS[i % 2];
        console.log(`\n--- Iteration ${i + 1} (Key: ${key.substring(0, 10)}...) ---`);

        try {
            const response = await fetch(OG_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dataCode: cleanCode, // Inject LOCAL code
                    params: {
                        address: ADDRESS,
                        sim_api_key: key
                    }
                })
            });

            const data = await response.json();

            if (data.logs && Array.isArray(data.logs)) {
                // print ALL logs to verify execution flow
                console.log("Logs:");
                data.logs.forEach(l => console.log("  " + l));
            }

            if (JSON.stringify(data).includes("[ERROR]") || JSON.stringify(data.result).includes("[ERROR]")) {
                console.error("❌ FAILURE: [ERROR] detected in response.");
            } else if (data.result && !data.result.is_error) {
                console.log("✅ SUCCESS: Valid result returned.");
                console.log("   Status:", data.result.status);
            } else {
                console.log("⚠️ UNKNOWN/PARTIAL: ", data);
            }

        } catch (e) {
            console.error("Request Failed:", e.message);
        }

        // Slight delay
        await new Promise(r => setTimeout(r, 1000));
    }
}

runTest();
