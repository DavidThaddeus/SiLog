import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans, DM_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ServiceWorkerRegister } from "./sw-register";
import { FacebookPixelScript } from "@/components/FacebookPixelScript";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "SiLog — SIWES Logbook Assistant",
  description:
    "AI-powered logbook assistant for Nigerian SIWES students. Write perfect logbook entries regardless of course, company, or attendance pattern.",
  manifest: "/manifest.json",
  keywords: ["SIWES", "logbook", "AI", "Nigerian students"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SiLog",
  },
  icons: {
    icon: [
      { url: "/logo-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/logo-180.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/logo-192.png",
  },
  openGraph: {
    title: "SiLog — SIWES Logbook Assistant",
    description:
      "AI-powered logbook assistant for Nigerian SIWES students. Write perfect logbook entries regardless of course, company, or attendance pattern.",
    url: "https://www.silog.pro",
    siteName: "SiLog",
    images: [
      {
        url: "https://www.silog.pro/og-image.png",
        width: 2748,
        height: 1568,
        alt: "SiLog — SIWES Logbook Assistant",
      },
    ],
    type: "website",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "SiLog — SIWES Logbook Assistant",
    description:
      "AI-powered logbook assistant for Nigerian SIWES students. Write perfect logbook entries regardless of course, company, or attendance pattern.",
    images: ["https://www.silog.pro/og-image.png"],
    site: "@silogpro",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-B08CZLGC33"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-B08CZLGC33');
          `}
        </Script>
      </head>
      <body className="font-sans antialiased min-h-screen">
        <FacebookPixelScript />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
