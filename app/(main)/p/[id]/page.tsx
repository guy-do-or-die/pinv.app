import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import { getPin } from '@/lib/server/pin';
import { NEXT_PUBLIC_APP_URL } from '@/lib/config';
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
    const pin = await getPin(pinId);

    if (!pin) {
        return {
            title: 'Pin Not Found',
        };
    }

    const appUrl = NEXT_PUBLIC_APP_URL;

    // Construct Dynamic Image URL with params
    // SAME DOMAIN ACCESS: Rely on Next.js Rewrite or Ingress to route /og/*
    const imageObjUrl = new URL(`${appUrl}/og/${pinId}`);
    const timestamp = Date.now();
    imageObjUrl.searchParams.set('t', timestamp.toString());

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
    const resolvedSearchParams = await searchParams; // Next.js 15+ needs await, sticking to safe pattern
    const pinId = parseInt(idStr);
    const pin = await getPin(pinId);

    if (!pin) {
        notFound();
    }

    // Convert searchParams to simple Record<string, string> for PinParams
    const initialParams: Record<string, string> = {};
    if (resolvedSearchParams) {
        Object.entries(resolvedSearchParams).forEach(([key, value]) => {
            if (typeof value === 'string') {
                initialParams[key] = value;
            }
        });
    }

    return <PinViewer pin={pin} pinId={pinId} initialParams={initialParams} />
}
