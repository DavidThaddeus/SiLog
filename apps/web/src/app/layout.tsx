import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "SiLog — SIWES Logbook Assistant",
  description:
    "AI-powered logbook assistant for Nigerian SIWES students. Write perfect logbook entries regardless of course, company, or attendance pattern.",
  icons: {
    icon: [
      { url: "/silogfinal.png", sizes: "256x256", type: "image/png" },
      { url: "/silogfinal.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/silogfinal.png", sizes: "180x180", type: "image/png" },
    ],
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
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
