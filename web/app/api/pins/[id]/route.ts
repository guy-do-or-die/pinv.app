import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        // Consume body (even if ignored) to prevent connection issues
        await request.json();

        // Force Cache Invalidation
        revalidateTag('pin-data', {}); // Invalidate Data Cache
        revalidatePath(`/p/${id}`); // Invalidate Page Cache

        console.log(`[API] Revalidated cache for Pin ${id}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update pin:', error);
        return NextResponse.json(
            { error: 'Failed to update pin' },
            { status: 500 }
        );
    }
}
