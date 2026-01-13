import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import { getPin } from '@/lib/server/pin';
import { NEXT_PUBLIC_APP_URL } from '@/lib/config';
import { encodeBundle, decodeBundle } from '@/lib/bundle-utils';
import PinViewer from "@/components/features/viewer/PinViewer";
import { constructMetadata } from "@/lib/metadata";


type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id: idStr } = await params;
    const resolvedSearchParams = await searchParams;
    const pinId = parseInt(idStr);

    // Decode Bundle to get Version
    let version: number | undefined;
    const rawB = resolvedSearchParams?.['b'];
    if (rawB && typeof rawB === 'string') {
        const bundle = decodeBundle(rawB);
        if (bundle && bundle.ver) {
            try { version = parseInt(bundle.ver); } catch (e) { }
        }
    }

    const pin = await getPin(pinId, version);

    if (!pin) {
        return {
            title: 'Pin Not Found',
        };
    }

    const appUrl = NEXT_PUBLIC_APP_URL;

    // Construct Dynamic Image URL with params
    // SAME DOMAIN ACCESS: Rely on Next.js Rewrite or Ingress to route /og/*
    const imageObjUrl = new URL(`${appUrl}/og/${pinId}`);

    // If we have a signed, versioned pin state, use it to ensure the OG image matches exactly
    if (pin.version && pin.widget?.signature && pin.widget?.timestamp) {
        const bundle = {
            ver: pin.version,
            params: pin.widget.previewData || {},
            ts: pin.widget.timestamp
        };
        const encodedBundle = encodeBundle(bundle);
        imageObjUrl.searchParams.set('b', encodedBundle);
        imageObjUrl.searchParams.set('sig', pin.widget.signature);
        // Omit 't' to allow caching of this specific version
    } else {
        // Fallback or Dynamic: use timestamp to force fresh render
        const timestamp = Date.now();
        imageObjUrl.searchParams.set('t', timestamp.toString());
    }

    // Apply search params overrides if present (e.g. dynamic frames)
    if (resolvedSearchParams) {
        Object.entries(resolvedSearchParams).forEach(([key, value]) => {
            if (typeof value === 'string') {
                imageObjUrl.searchParams.set(key, value);
            }
        });
    }

    const imageUrl = imageObjUrl.toString();
    const pinUrl = `${appUrl}/p/${pinId}`;

    return constructMetadata({
        title: pin.title,
        description: pin.tagline,
        imageUrl: imageUrl,
        url: pinUrl,
    });
}

export default async function PinPage({ params, searchParams }: Props) {
    const { id: idStr } = await params;
    const resolvedSearchParams = await searchParams;
    const pinId = parseInt(idStr);

    // 1. Decode Bundle FIRST to get version
    const initialParams: Record<string, string> = {};
    let version: number | undefined;
    let bundleParams = {};

    const rawB = resolvedSearchParams?.['b'];
    if (rawB && typeof rawB === 'string') {
        const bundle = decodeBundle(rawB);
        if (bundle) {
            if (bundle.ver) {
                try { version = parseInt(bundle.ver); } catch (e) { }
            }
            if (bundle.params) {
                bundleParams = bundle.params;
            }
        }
    }

    // 2. Fetch Pin with Version
    const pin = await getPin(pinId, version);

    if (!pin) {
        notFound();
    }

    // 3. Merge Params: Bundle -> SearchParams (Higher Priority)
    Object.assign(initialParams, bundleParams);

    // 4. Apply other params (Overrides)
    if (resolvedSearchParams) {
        Object.entries(resolvedSearchParams).forEach(([key, value]) => {
            if (typeof value === 'string' && key !== 'b' && key !== 'sig') {
                initialParams[key] = value;
            }
        });
    }

    return <PinViewer pin={pin} pinId={pinId} initialParams={initialParams} />
}
