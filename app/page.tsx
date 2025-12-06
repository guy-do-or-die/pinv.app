import Image from "next/image";

import { Metadata } from 'next';
import { NEXT_PUBLIC_APP_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'PinV - Pinned Casts Dynamic View',
  description: 'Share your pinned casts with style.',
  openGraph: {
    title: 'PinV',
    description: 'Share your pinned casts with style.',
    images: [`${NEXT_PUBLIC_APP_URL}/icon.png`],
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: `${NEXT_PUBLIC_APP_URL}/icon.png`,
      button: {
        title: 'Launch PinV',
        action: {
          type: 'launch_miniapp',
          name: 'PinV',
          url: NEXT_PUBLIC_APP_URL,
          splashImageUrl: `${NEXT_PUBLIC_APP_URL}/icon.png`,
          splashBackgroundColor: '#ffffff',
        },
      },
    }),
    'fc:frame': JSON.stringify({
      version: '1',
      imageUrl: `${NEXT_PUBLIC_APP_URL}/icon.png`,
      button: {
        title: 'Launch PinV',
        action: {
          type: 'launch_frame',
          name: 'PinV',
          url: NEXT_PUBLIC_APP_URL,
          splashImageUrl: `${NEXT_PUBLIC_APP_URL}/icon.png`,
          splashBackgroundColor: '#ffffff',
        },
      },
    }),
  },
};

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <main className="flex flex-col items-center justify-center gap-8 px-8 text-center">
        <div className="relative">
          <Image
            src="/logo.svg"
            alt="PinV Logo"
            width={260}
            height={260}
            priority
          />
        </div>

        <p className="text-xl font-medium text-gray-600 sm:text-2xl">
          Pinned casts dynamic view
        </p>
      </main>
    </div>
  );
}
