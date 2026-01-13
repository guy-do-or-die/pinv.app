import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt, currentWidgets } = body;

        // Mock LLM response: Just adds a new text widget or reorders
        // In a real app, this would call OpenAI/Anthropic

        const newWidget = {
            id: `w-${Date.now()}`,
            type: 'text',
            title: 'AI Suggestion',
            content: { text: `Here is a suggestion based on "${prompt}": Check out this cool project!` },
            order: currentWidgets.length
        };

        return NextResponse.json({
            suggestedWidgets: [...currentWidgets, newWidget]
        });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to generate layout' }, { status: 500 });
    }
}
