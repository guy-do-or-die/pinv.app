export const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pinv.app';

export const APP_CONFIG = {
    // Used in layout.tsx (metadata) and manifest (name, ogTitle)
    title: 'PinV ᵅ',
    // Used in layout.tsx (metadata title)
    defaultTitle: 'PinV ᵅ - Pinned Casts Dynamic View',
    // Used in layout.tsx (metadata) and manifest (description, ogDescription)
    description: 'Earn from dynamic content on Farcaster and Base App',
    // Used in manifest (subtitle)
    subtitle: 'Pinned casts dynamic view',
    // Used in manifest (tagline)
    tagline: 'Pinned casts dynamic view',
    // Used in layout.tsx (icons, openGraph, fc metadata) and manifest (iconUrl, splashImageUrl)
    iconUrl: `${NEXT_PUBLIC_APP_URL}/icon.png`,
    // Used in PinViewer.tsx
    shareText: 'Here’s my PinV 👇',
    // Used in manifest
    heroImageUrl: `${NEXT_PUBLIC_APP_URL}/icon.png`,
    // Used in manifest
    screenshotUrls: [`${NEXT_PUBLIC_APP_URL}/icon.png`],
    // Used in manifest
    ogImageUrl: `${NEXT_PUBLIC_APP_URL}/icon.png`,
    // Used in layout.tsx and manifest
    splashBackgroundColor: '#F6F7FA',
    // Used in manifest
    webhookUrl: `${NEXT_PUBLIC_APP_URL}/api/webhook`,
    // Used in manifest
    primaryCategory: 'social',
    // Used in manifest
    tags: ['farcaster', 'pins', 'social'],
    // Used in manifest for account association
    ownerAddress: '0x906754F840Fc07676Ac9b20556a05d7200B6dE49',
};
