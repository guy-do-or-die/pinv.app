import { notFound } from 'next/navigation';
import ShareButton from '@/components/ShareButton';
import { Metadata, ResolvingMetadata } from 'next';
import { headers } from 'next/headers';
import { blockchainService } from '@/lib/blockchain-service';
import Header from '@/components/Header';
import { NEXT_PUBLIC_APP_URL } from '@/lib/config';
import { getPin } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {
    params: Promise<{ fid: string }>;
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { fid: fidStr } = await params;
    const fid = parseInt(fidStr);
    const pin = await blockchainService.getPin(fid);

    if (!pin) {
        return {
            title: 'Pin Not Found',
        };
    }

    const appUrl = NEXT_PUBLIC_APP_URL;

    const timestamp = Date.now();
    const imageUrl = `${appUrl}/api/og/p/${fid}?t=${timestamp}`;
    const pinUrl = `${appUrl}/p/${fid}`;

    const fcMetadata = {
        version: '1',
        imageUrl: imageUrl,
        button: {
            title: 'View PinV',
            action: {
                type: 'launch_miniapp',
                name: 'PinV',
                url: pinUrl,
                splashImageUrl: `${appUrl}/icon.png`,
                splashBackgroundColor: pin.accentColor,
            },
        },
    };

    const fcFrameMetadata = {
        ...fcMetadata,
        button: {
            ...fcMetadata.button,
            action: {
                ...fcMetadata.button.action,
                type: 'launch_frame',
            }
        }
    };

    return {
        title: pin.title,
        description: pin.tagline,
        openGraph: {
            title: pin.title,
            description: pin.tagline,
            images: [imageUrl],
        },
        other: {
            'fc:miniapp': JSON.stringify(fcMetadata),
            'fc:frame': JSON.stringify(fcFrameMetadata),
        },
    };
}

export default async function PinPage({ params }: Props) {
    const { fid: fidStr } = await params;
    const fid = parseInt(fidStr);
    const pin = await blockchainService.getPin(fid);

    if (!pin) {
        notFound();
    }

    // Hardcoding URL to ensure it works with ngrok and Farcaster
    const appUrl = NEXT_PUBLIC_APP_URL;
    const pinUrl = `${appUrl}/p/${fid}`;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <Header />

                <Card className="border-2" style={{ borderColor: `${pin.accentColor}40` }}>
                    <CardHeader className="text-center">
                        <div className="mx-auto w-24 h-24 rounded-full mb-4 flex items-center justify-center bg-muted text-4xl font-black" style={{ backgroundColor: `${pin.accentColor}20`, color: pin.accentColor }}>
                            {pin.handle[0].toUpperCase()}
                        </div>
                        <CardTitle className="text-3xl">{pin.title}</CardTitle>
                        <CardDescription className="text-xl">@{pin.handle}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-center text-muted-foreground">{pin.tagline}</p>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 rounded-lg bg-muted/50">
                                <div className="text-2xl font-bold">{pin.stats.githubRepos}</div>
                                <div className="text-xs text-muted-foreground uppercase">Repos</div>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <div className="text-2xl font-bold">{pin.stats.githubStars}</div>
                                <div className="text-xs text-muted-foreground uppercase">Stars</div>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <div className="text-2xl font-bold">{pin.stats.followerCount}</div>
                                <div className="text-xs text-muted-foreground uppercase">Followers</div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <div className="flex gap-4 w-full">
                            <Button className="flex-1" asChild>
                                <Link href={`/p/${fid}/edit`}>Edit Pin</Link>
                            </Button>
                            <ShareButton url={pinUrl} />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                            Last updated: {new Date(pin.lastUpdated).toLocaleDateString()}
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
