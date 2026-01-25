import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import localFont from "next/font/local"

import Providers from "@/components/shared/Providers"
import Notifications from "@/components/shared/Notifications"
import Polyfills from "@/components/shared/Polyfills"

import { defaultMetadata } from "@/lib/metadata"

import "./globals.css"

export const metadata: Metadata = defaultMetadata

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const orbitron = localFont({
  src: "../public/fonts/Orbitron Regular.woff2",
  variable: "--font-orbitron",
})


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased`}>
        <Providers>
          <Polyfills />
          <Notifications />
          {children}
        </Providers>
      </body>
    </html>
  );
}
