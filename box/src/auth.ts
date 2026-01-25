import type { Context, Next } from "hono";

export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header("Authorization");
    const expectedKey = process.env.INTERNAL_AUTH_KEY;

    if (!expectedKey) {
        if (process.env.NODE_ENV === "production" || process.env.STRICT_AUTH === "true") {
            console.error("[Auth] Fatal: INTERNAL_AUTH_KEY missing in Production!");
            return c.json({ error: "Service Misconfigured: Auth Key Missing" }, 500);
        }
        console.warn("[Auth] No INTERNAL_AUTH_KEY set! Allowing all (Dev Mode)");
        await next();
        return;
    }

    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
        console.warn(`[Auth] Failed: Expected Bearer [HIDDEN], Got ${authHeader ? authHeader.substring(0, 10) + '...' : 'None'}`);
        return c.json({ error: "Unauthorized Service Access" }, 401);
    }

    await next();
}
