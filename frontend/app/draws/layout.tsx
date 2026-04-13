import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canada PR Express Entry Draws 2024–2025 | IRCC Tracker",
  description:
    "Latest Canada Express Entry draw results with CRS cutoff scores, draw sizes, and historical trends. Federal Skilled Worker, Canadian Experience Class, and category-based draws.",
  keywords:
    "express entry draw, CRS cutoff, Canada PR draw, IRCC draw results, express entry 2025, CEC draw, FSW draw",
  openGraph: {
    title: "Canada Express Entry Draw Results | IRCC Tracker",
    description:
      "Latest PR draw results with CRS scores and trends. Updated after every draw.",
    url: "https://ircctracker.org/draws",
    siteName: "IRCC Tracker",
    type: "website",
  },
  alternates: {
    canonical: "https://ircctracker.org/draws",
  },
};

export default function DrawsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
