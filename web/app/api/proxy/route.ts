import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    try {
        console.log(`[LocalProxy] Fetching: ${url}`);

        // Construct clean headers - minimal forwarding to avoid browser fingerprinting issues
        const headers = new Headers();

        // Allowed headers to forward (Whitelist approach)
        const allowedHeaders = ['authorization', 'content-type', 'accept', 'x-api-key', 'x-auth-token'];

        req.headers.forEach((value, key) => {
            if (allowedHeaders.includes(key.toLowerCase())) {
                headers.set(key, value);
            }
        });

        // Set standard generic headers
        headers.set('Accept', 'application/json, */*;q=0.5');

        // Force a browser-like User-Agent to bypass basic 403 blocks (common with CoinGecko/CoinCap)
        headers.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const response = await fetch(url, {
            headers: headers,
            cache: 'no-store' // Prevent caching proxy responses by default
        });

        const data = await response.arrayBuffer();

        // Forward response headers
        const responseHeaders = new Headers();
        response.headers.forEach((value, key) => {
            // Filter potentially problematic response headers
            if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
                responseHeaders.set(key, value);
            }
        });

        // Ensure CORS and Content-Type
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        if (!responseHeaders.has('Content-Type')) {
            responseHeaders.set('Content-Type', 'application/octet-stream');
        }

        return new NextResponse(data, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders
        });

    } catch (e: any) {
        console.error('[LocalProxy] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
