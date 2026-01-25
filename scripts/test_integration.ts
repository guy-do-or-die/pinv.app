
const OG_URL = "http://localhost:4444";

async function main() {
    console.log("🔍 Starting Integration Test...");

    // 1. Health Check
    try {
        const h = await fetch(`${OG_URL}/health`);
        const hJson = await h.json();
        console.log("✅ [OG Health]", h.status, hJson);
    } catch (e) {
        console.error("❌ [OG Health] Failed:", e.message);
        process.exit(1);
    }

    // 2. Preview Request
    const payload = {
        dataCode: "return { message: params.msg + ' from Box!' };",
        params: { msg: "Hello" },
        uiCode: "<div style='display: flex; color: white'> {{ message }} </div>"
    };

    console.log("📡 Sending Preview Request...");
    try {
        const res = await fetch(`${OG_URL}/og/preview`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log(`📥 Response (${res.status}):`);
        console.log(text);

        if (res.status === 200) {
            const json = JSON.parse(text);
            if (json.result?.message === "Hello from Box!" && json.image) {
                console.log("✅ SUCCESS: Execution and Rendering worked!");
            } else {
                console.warn("⚠️ PARTIAL SUCCESS: Check contents.");
            }
        } else {
            console.error("❌ FAILED: Non-200 Status");
        }

    } catch (e) {
        console.error("❌ Request Failed:", e);
    }
}

main();
