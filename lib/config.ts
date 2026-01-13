// Fail fast helper to prevent silent config failures
function requireEnv(value: string | undefined, key: string): string {
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

// Strictly require NEXT_PUBLIC_APP_URL to be set in .env or .env.local
export const NEXT_PUBLIC_APP_URL = requireEnv(process.env.NEXT_PUBLIC_APP_URL, 'NEXT_PUBLIC_APP_URL');

export const APP_CONFIG = {
    // Used in layout.tsx (metadata) and manifest (name, ogTitle)
    title: 'PinVᵅ',
    // Used in layout.tsx (metadata title)
    defaultTitle: 'PinVᵅ - Pinned Casts Dynamic View',
    // Used in layout.tsx (metadata) and manifest (description, ogDescription)
    description: 'Earn from dynamic content on Farcaster and Base App',
    // Used in manifest (subtitle)
    subtitle: 'Pinned casts dynamic view',
    // Used in manifest (tagline)
    tagline: 'Pinned casts dynamic view',
    // Used in layout.tsx (icons, openGraph, fc metadata) and manifest (iconUrl, splashImageUrl)
    iconUrl: `${NEXT_PUBLIC_APP_URL}/icon.png`,
    // Used in layout.tsx (splashImageUrl) and manifest (splashImageUrl)
    splashImageUrl: `${NEXT_PUBLIC_APP_URL}/splash.png`,
    // Used in PinViewer.tsx
    shareText: 'Here’s my PinV 👇',
    // Used in manifest
    heroImageUrl: `${NEXT_PUBLIC_APP_URL}/hero.png`,
    // Used in manifest
    screenshotUrls: [`${NEXT_PUBLIC_APP_URL}/hero.png`],
    // Used in manifest
    ogImageUrl: `${NEXT_PUBLIC_APP_URL}/hero.png`,
    // Used in layout.tsx and manifest
    splashBackgroundColor: '#16161b',
    // Used in manifest
    webhookUrl: `${NEXT_PUBLIC_APP_URL}/api/webhook`,
    // Used in manifest
    primaryCategory: 'social',
    // Used in manifest
    tags: ['farcaster', 'pins', 'social'],
    // Used in manifest for account association
    ownerAddress: '0x906754F840Fc07676Ac9b20556a05d7200B6dE49',
    // Used in metadata for Base App identification
    baseAppId: '693666bc0443bc3eb93dbce4',
};
