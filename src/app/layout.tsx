import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import Navbar from "./components/navbar";
import Sidebar from "./components/sidebar";
import User_sync from "./components/user_sync";
import { MpProvider } from "./context/mp_context";
import { Analytics } from "@vercel/analytics/next";
import Session_tracking from "./components/session_tracking";

const geist_sans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geist_mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Studio Moikas",
  description: "A creative studio app with AI-powered image generation.",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: [
    "nextjs",
    "pwa",
    "ai",
    "image generation",
    "studio moikas",
    "creative studio",
  ],
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#35155D" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  authors: [{ name: "Warren Gates", url: "https://your-portfolio-url.com" }],
  viewport:
    "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
  icons: [
    { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
    { rel: "icon", url: "/icons/icon-192x192.png" },
  ],
  openGraph: {
    title: "Studio Moikas",
    description: "A creative studio app with AI-powered image generation.",
    url: "https://your-domain.com",
    siteName: "Studio Moikas",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Studio Moikas Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio Moikas",
    description: "A creative studio app with AI-powered image generation.",
    images: ["/icons/icon-512x512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist_sans.variable} ${geist_mono.variable} antialiased`}
      >
        <ClerkProvider>
          <MpProvider>
            <Session_tracking />
            <Navbar />
            <div className="flex min-h-screen">
              <SignedIn>
                <User_sync />
                <Sidebar />
              </SignedIn>
              <main className="flex-1">{children}</main>
            </div>
            <Analytics />
          </MpProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
