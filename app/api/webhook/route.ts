import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Log the webhook event for low-overhead analytics/debugging
        console.log('[MiniApp Webhook] Received event:', JSON.stringify(body, null, 2));

        // TODO: Verify signature header from Base/Farcaster if required in future
        // const signature = req.headers.get('x-farcaster-signature');

        // Identify event type (if applicable structure exists)
        // For now, we just acknowledge receipt to avoid retries

        return Response.json({ success: true, message: 'Event received' });
    } catch (error) {
        console.error('[MiniApp Webhook] Error processing request:', error);
        return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
