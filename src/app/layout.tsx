import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import Navbar from "./components/navbar";
import Sidebar from "./components/sidebar";
import User_sync from "./components/user_sync";
import { MpProvider } from "./context/mp_context";
import { Analytics } from "@vercel/analytics/next";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';

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
  keywords: ["nextjs", "pwa", "ai", "image generation", "studio moikas", "creative studio"],
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#35155D" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" }
  ],
  authors: [
    { name: "Warren Gates", url: "https://your-portfolio-url.com" }
  ],
  viewport: "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
  icons: [
    { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
    { rel: "icon", url: "/icons/icon-192x192.png" }
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
        alt: "Studio Moikas Logo"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio Moikas",
    description: "A creative studio app with AI-powered image generation.",
    images: ["/icons/icon-512x512.png"]
  }
};

function useSessionTracking() {
  const pathname = usePathname();
  useEffect(() => {
    // Set session start time if not already set
    if (!localStorage.getItem('session_start')) {
      localStorage.setItem('session_start', Date.now().toString());
    }
    // Initialize visited pages array
    let visited = [];
    try {
      visited = JSON.parse(localStorage.getItem('visited_pages') || '[]');
    } catch {
      visited = [];
    }
    // Add current page if not already last
    if (visited[visited.length - 1] !== pathname) {
      visited.push(pathname);
      localStorage.setItem('visited_pages', JSON.stringify(visited));
    }
  }, [pathname]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const start = parseInt(localStorage.getItem('session_start') || '0', 10);
      const duration = start ? Math.floor((Date.now() - start) / 1000) : 0;
      let visited = [];
      try {
        visited = JSON.parse(localStorage.getItem('visited_pages') || '[]');
      } catch {
        visited = [];
      }
      track('Session Ended', {
        duration_seconds: duration,
        visited_pages: visited.join(','),
        timestamp: new Date().toISOString(),
      });
      // Clean up for next session
      localStorage.removeItem('session_start');
      localStorage.removeItem('visited_pages');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useSessionTracking();
  return (
    <html lang="en">
      <body
        className={`${geist_sans.variable} ${geist_mono.variable} antialiased`}
      >
        <ClerkProvider>
          <MpProvider>
            <Navbar />
            <div className="flex min-h-screen">
              <SignedIn>
                <User_sync />
                <Sidebar />
              </SignedIn>
              <main className="flex-1">
                {children}
              </main>
            </div>
            <Analytics />
          </MpProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
