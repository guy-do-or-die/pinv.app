import { ImageResponse } from 'next/og';
import { getPin } from '@/lib/server/pin';



export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { searchParams } = new URL(request.url);
    const hasPreviewParams = searchParams.has('title')

    const { id: idStr } = await params;
    const pinId = parseInt(idStr);

    // Default pin data
    let pin = await getPin(pinId) || {
        title: 'Pin Not Found',
        tagline: '',
        widgets: [],
        widget: undefined,
        lastUpdated: new Date().toISOString()
    };

    // Override with Query Params for Preview
    if (hasPreviewParams) {
        pin = {
            ...pin,
            title: searchParams.get('title') || pin.title,
            tagline: searchParams.get('tagline') || pin.tagline,
        };
    }

    // 4. Render Dynamic Widget (if available)
    if (pin.widget && pin.widget.uiCode) {

        // PROXY TO OG ENGINE (If Configured)
        const ogEngineUrl = process.env.NEXT_PUBLIC_OG_ENGINE_URL;
        if (ogEngineUrl) {
            try {
                // Construct Proxy URL
                // We forward the pinId and the query string
                const targetUrl = new URL(`${ogEngineUrl}/og/${pinId}`);
                searchParams.forEach((val, key) => targetUrl.searchParams.append(key, val));

                const response = await fetch(targetUrl);
                if (response.ok) {
                    return new Response(response.body, {
                        headers: {
                            'Content-Type': 'image/png',
                            'Cache-Control': response.headers.get('Cache-Control') || 'public, max-age=60'
                        }
                    });
                }
            } catch (e) {
                console.error("OG Proxy Failed:", e);
                // Fallthrough to legacy safe render
            }
        }

        try {
            // Merge defaults (previewData) -> Saved Config
            const baseProps: any = {
                ...(pin.widget.previewData || {}),
                ...(pin.widget.userConfig || {}),
            };

            // 4.1. Determine Input Parameters
            const inputParams = { ...baseProps }; // Start with merged config/defaults

            // Override with query params if allowed
            if (pin.widget.parameters) {
                pin.widget.parameters.forEach((param: any) => {
                    const queryValue = searchParams.get(param.name);
                    if (queryValue) {
                        inputParams[param.name] = queryValue;
                    }
                });
            }

            // 4.2. Render React Widget
            // Add standard context
            const calculatedProps = { ...inputParams, viewer_fid: 'preview' };

            const { renderWidget } = await import('@/lib/widget-renderer');
            // @ts-ignore
            return await renderWidget(pin.widget.uiCode, calculatedProps);
        } catch (e) {
            console.error("Failed to render dynamic widget in OG:", e);
            // Fallback to default card
        }
    } else {
    }

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#1a1a1a',
                    backgroundImage: `linear-gradient(to bottom right, #1a1a1a, #3b82f680)`,
                    color: 'white',
                    padding: '80px',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', fontSize: 32, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '4px' }}>
                        {pin.title}
                    </div>
                    <div style={{ display: 'flex', fontSize: 80, fontWeight: 900, marginTop: 20 }}>
                        {pin.tagline}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '40px',
                            padding: '40px 80px',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            width: '80%',
                            height: '60%', // Make it take up decent space
                        }}
                    >
                        <div style={{ display: 'flex', fontSize: 48, textAlign: 'center', marginBottom: 20 }}>
                            {pin.tagline || 'No description available'}
                        </div>

                        <div style={{ display: 'flex', fontSize: 24, opacity: 0.6, marginTop: 40, alignItems: 'center', gap: '10px' }}>
                            {/* Simple SVG icon for "Widget" */}
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                <path d="M3 9h18" />
                                <path d="M9 21V9" />
                            </svg>
                            <span>Preview Unavailable</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', fontSize: 24, opacity: 0.5 }}>
                        pinv.app
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 800,
            headers: {
                'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=600',
            }
        }
    );
}
