import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FeedbackButton from "@/components/FeedbackButton";
import TrustBanner from "@/components/TrustBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IRCC Processing Times Tracker | Canada Immigration Wait Times 2025",
  description:
    "Track Canada immigration processing times updated daily. Check wait times for visitor visa, work permit, study permit, Express Entry PR and more. Free tools: CRS calculator, PR pathway finder, permit tracker.",
  keywords:
    "IRCC processing times, Canada immigration wait times, express entry draw, CRS calculator, work permit processing, study permit Canada, visitor visa Canada, PR tracker",
  authors: [{ name: "IRCC Tracker" }],
  metadataBase: new URL("https://ircctracker.org"),
  openGraph: {
    title: "IRCC Tracker | Canada Immigration Processing Times & Tools",
    description:
      "Live Canada immigration processing times + free tools: CRS calculator, PR pathway finder, permit expiry tracker, proof of funds calculator.",
    url: "https://ircctracker.org",
    siteName: "IRCC Tracker",
    type: "website",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "IRCC Tracker | Canada Immigration Processing Times",
    description:
      "Live Canada immigration processing times + CRS calculator, PR pathway finder, and permit tracker. Updated daily.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  alternates: {
    canonical: "https://ircctracker.org",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="canada-topbar" />
        {/* Site-wide trust signal: live "Last IRCC sync: Xh ago" + sources +
            link to /methodology. Sits in flow above every page header so it
            doesn't push or hide any sticky/fixed elements (avoiding the
            position conflict the original `fixed top-0` proposal would have
            caused with the existing Header + the /crs sticky score panel). */}
        <TrustBanner />
        {children}
        <FeedbackButton />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "IRCC Tracker",
              url: "https://ircctracker.org",
              description:
                "Track Canada immigration processing times and use free tools: CRS calculator, PR pathway finder, permit expiry tracker, proof of funds calculator.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://ircctracker.org/?country={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
