
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @ts-ignore
import emojiRegex from 'emoji-regex';

// --- Font Cache ---
const possiblePaths = [
    path.join(__dirname, '../../public/fonts'), // Local Dev (relative to og/services)
    path.join(__dirname, '../public/fonts'),    // Dist (relative to dist/services)
    path.join(process.cwd(), 'og/public/fonts'),
    path.join(process.cwd(), 'public/fonts'),
];
const fontPath = possiblePaths.find(p => fs.existsSync(p));

let interRegular: Buffer | null = null;
let interBold: Buffer | null = null;
let emojiFont: Buffer | null = null;

try {
    if (fontPath) {
        const load = (file: string) => {
            const p = path.join(fontPath, file);
            if (fs.existsSync(p)) return fs.readFileSync(p);
            return null;
        };

        interRegular = load('Inter_18pt-Medium.ttf');
        interBold = load('Inter_18pt-SemiBold.ttf');
        emojiFont = load('NotoEmoji-Regular.ttf');

        if (!interRegular) console.warn("[Assets] Inter font missing");
        if (!emojiFont) console.warn("[Assets] Local Emoji font missing");
    } else {
        console.warn("[Assets] Font directory not found");
    }
} catch (e) {
    console.error("[Assets] Font Load Failed at Startup:", e);
}

// --- Twemoji Loader ---
// Using jdecked/twemoji for Unicode 15+ support (original twitter repo is stale)
const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg';

async function loadTwemoji(emojiChar: string): Promise<string | null> {
    try {
        const codePoints = [...emojiChar].map(c => c.codePointAt(0)!);
        const hex = codePoints.map(c => c.toString(16)).join('-');

        let url = `${TWEMOJI_BASE}/${hex}.svg`;
        let res = await fetch(url);

        // Retry logic for variation selectors
        if (!res.ok && hex.endsWith('-fe0f')) {
            url = `${TWEMOJI_BASE}/${hex.replace(/-fe0f$/, '')}.svg`;
            res = await fetch(url);
        }

        if (res.ok) {
            const svgText = await res.text();
            const base64 = Buffer.from(svgText).toString('base64');
            return `data:image/svg+xml;base64,${base64}`;
        }
    } catch (e) {
        console.error(`[Assets] Twemoji fetch failed for ${emojiChar}:`, e);
    }
    return null;
}

export async function loadGraphemeImages(htmlString: string): Promise<Record<string, string>> {
    const regex = emojiRegex();
    const foundEmojis = new Set<string>();
    let match;
    while ((match = regex.exec(htmlString))) {
        foundEmojis.add(match[0]);
    }

    const graphemeImages: Record<string, string> = {};
    if (foundEmojis.size > 0) {
        const results = await Promise.all(
            Array.from(foundEmojis).map(async (char) => ({
                char,
                dataUrl: await loadTwemoji(char)
            }))
        );

        results.forEach(({ char, dataUrl }) => {
            if (dataUrl) graphemeImages[char] = dataUrl;
        });
    }
    return graphemeImages;
}

export async function loadDynamicFonts(userConfig: any): Promise<any[]> {
    const dynamicFonts: any[] = [];
    if (userConfig.fonts && Array.isArray(userConfig.fonts)) {
        const fontRequests = userConfig.fonts.map(async (fontDef: any) => {
            try {
                const res = await fetch(fontDef.url);
                if (!res.ok) throw new Error(`404 ${fontDef.url}`);
                return {
                    name: fontDef.name,
                    data: Buffer.from(await res.arrayBuffer()),
                    weight: fontDef.weight || 400,
                    style: fontDef.style || 'normal'
                };
            } catch (e: any) {
                console.error("[Worker] Font fetch failed:", e.message);
                return null;
            }
        });
        const results = await Promise.all(fontRequests);
        dynamicFonts.push(...results.filter(Boolean));
    }
    return dynamicFonts;
}

export function getCoreFonts() {
    const fonts: any[] = [];
    if (interRegular) fonts.push({ name: 'Inter', data: interRegular, weight: 400, style: 'normal' });
    if (interBold) fonts.push({ name: 'Inter', data: interBold, weight: 700, style: 'normal' });
    if (emojiFont) fonts.push({ name: 'Noto Emoji', data: emojiFont, weight: 400, style: 'normal' });
    return fonts;
}
