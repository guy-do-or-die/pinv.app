import { NextResponse } from 'next/server';
import { withAxiom, AxiomRequest } from 'next-axiom';
import { createVerifyAppKeyWithHub, parseWebhookEvent } from '@farcaster/miniapp-node';

export const POST = withAxiom(async (req: AxiomRequest) => {
    try {
        const body = await req.json();

        // Use standard Farcaster public Hub (free) for verification
        const HUB_URL = 'https://nemes.farcaster.xyz:2281';
        const verifyAppKey = createVerifyAppKeyWithHub(HUB_URL);

        try {
            await parseWebhookEvent(body, verifyAppKey);
        } catch (err) {
            console.error('[MiniApp Webhook] Verification failed:', err);
            // Don't log to Axiom on verification failure to avoid spam/DoS costs
            return NextResponse.json({ error: 'Invalid signature or app key' }, { status: 401 });
        }

        // Log the validated event to Axiom for analytics/storage 
        const fid = body.fid || body.untrustedData?.fid || 'unknown';
        const timestamp = body.timestamp || Date.now();
        const eventId = `pinv:webhook:${fid}:${timestamp}`;

        req.log.info('MiniApp Webhook Received', {
            eventId,
            fid,
            timestamp,
            eventType: body.event || 'unknown',
            payload: body
        });

        // withAxiom automatically flushes logs after the handler returns
        console.log(`[MiniApp Webhook] Ingested event ${eventId} to Axiom`);
        return NextResponse.json({ success: true, message: 'Event ingested' });
    } catch (error) {
        console.error('[MiniApp Webhook] Error processing request:', error);
        req.log.error('MiniApp Webhook Server Error', { error: String(error) });
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
});
