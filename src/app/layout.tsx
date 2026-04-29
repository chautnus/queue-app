import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Providers from "@/components/Providers";
import LocaleProvider from "@/components/LocaleProvider";
import "./globals.css";
import VersionFooter from "@/components/VersionFooter";

export const metadata: Metadata = {
  title: { default: "FreeQueue", template: "%s | FreeQueue" },
  description: "Free queue management system for businesses. Let customers join queues via QR code and get real-time updates on their turn.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FreeQueue",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "FreeQueue — Free Queue Management System",
    description: "Let customers join queues via QR code and get real-time updates. Free queue management for any business.",
    siteName: "FreeQueue",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FreeQueue — Free Queue Management System",
    description: "Let customers join queues via QR code and get real-time updates. Free queue management for any business.",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <Providers>
          <LocaleProvider>{children}</LocaleProvider>
        </Providers>
        {adsenseId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <Script src="/sw-register.js" strategy="afterInteractive" />
        <VersionFooter />
      </body>
    </html>
  );
}
