import { NextResponse } from 'next/server';
import { GENERATION_SYSTEM_PROMPT } from '@/lib/prompts';
import { NEXT_PUBLIC_APP_URL } from '@/lib/config';

async function generateText(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    apiKey: string
): Promise<string> {
    const url = 'https://openrouter.ai/api/v1/chat/completions';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': NEXT_PUBLIC_APP_URL, // Optional, for including your app on openrouter.ai rankings.
            'X-Title': 'PinV', // Optional. Shows in rankings on openrouter.ai.
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 10000,
            temperature: 1.0,
            response_format: { type: "json_object" } // Prefer JSON mode if supported
        })
    });

    if (!response.ok) {
        let errText = '';
        try {
            errText = await response.text();
        } catch (e) {
            errText = response.statusText;
        }
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

export async function POST(req: Request) {
    try {
        const { prompt, contextParams } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const userContent = `
            User Prompt: ${prompt}
            
            Context Parameters:
            ${JSON.stringify(contextParams, null, 2)}
        `;

        // Default to Claude 3.5 Sonnet if not specified
        const model = process.env.LLM_MODEL || "anthropic/claude-3.5-sonnet";
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            // Fallback to legacy keys if OpenRouter key is missing (backward compatibility)
            // But for this task, we strongly assume user added OPENROUTER_API_KEY
            // We'll throw specific error to prompt user if it's missing.
            return NextResponse.json({ error: 'OPENROUTER_API_KEY not set' }, { status: 500 });
        }

        console.log("----------------------------------------------------------------");
        console.log("[Generate Debug] System Prompt:", GENERATION_SYSTEM_PROMPT);
        console.log("[Generate Debug] User Content:", userContent);
        console.log("[Generate Debug] Model:", model);
        console.log("----------------------------------------------------------------");

        const textContent = await generateText(model, GENERATION_SYSTEM_PROMPT, userContent, apiKey);

        // Robustly extract JSON: Find first '{' and last '}'
        const firstOpen = textContent.indexOf('{');
        const lastClose = textContent.lastIndexOf('}');

        if (firstOpen === -1 || lastClose === -1) {
            console.error("No JSON object found in response:", textContent);
            return NextResponse.json({
                error: 'Generation incomplete. Please try again.',
                details: 'The AI response was truncated or invalid.'
            }, { status: 500 });
        }

        const cleanContent = textContent.substring(firstOpen, lastClose + 1);

        try {
            const result = JSON.parse(cleanContent);
            return NextResponse.json(result);
        } catch (e) {
            console.error("Failed to parse LLM JSON:", cleanContent);
            return NextResponse.json({
                error: 'Failed to parse generated code',
                details: 'The AI produced invalid JSON. Please try again.'
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('AI API Error:', error);
        return NextResponse.json({
            error: 'Failed to connect to AI service',
            details: error.message
        }, { status: 500 });
    }
}
