
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import LayoutWithSidebar from "../components/LayoutWithSidebar";
import { MpProvider } from "../context/mp_context";
import Analytics_wrapper from "../components/analytics_wrapper";
import Session_tracking from "../components/session_tracking";
import Cookie_consent_banner from "../components/cookie_consent_banner";
import User_sync from "../components/user_sync";
import JobNotifications from "../components/job_notifications";
import { auth } from "@clerk/nextjs/server";

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
  authors: [{ name: "Warren Gates", url: "https://moikas.com" }],
  viewport:
    "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
  icons: [
    { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
    { rel: "icon", url: "/icons/icon-192x192.png" },
  ],
  openGraph: {
    title: "Studio Moikas",
    description: "A creative studio app with AI-powered image generation.",
    url: "https://studio.moikas.com",
    siteName: "Studio Moikas",
    images: [
      {
        url: "/studio_moikas.PNG",
        width: 1200,
        height: 630,
        alt: "Studio Moikas Landing Page",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Studio Moikas",
    description: "A creative studio app with AI-powered image generation.",
    images: ["/studio_moikas.PNG"],
  },
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? "https://studio.moikas.com"
      : "http://localhost:3000"
  ),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { has } = await auth();
  const plan = has({ plan: "standard" }) ? "standard" : "free";
  return (
    <html lang="en">
      <body
        className={`${geist_sans.variable} ${geist_mono.variable} antialiased`}
      >
        <ClerkProvider>
          <MpProvider>
            <Session_tracking />
            <User_sync plan={plan} />
            <JobNotifications />
            <LayoutWithSidebar>{children}</LayoutWithSidebar>

            <Analytics_wrapper />
            <Cookie_consent_banner />
          </MpProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
