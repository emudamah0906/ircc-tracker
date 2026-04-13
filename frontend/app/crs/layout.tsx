import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CRS Score Calculator 2025 | Canada Express Entry | IRCC Tracker",
  description:
    "Calculate your Comprehensive Ranking System (CRS) score for Canada Express Entry. Includes age, education, language (IELTS/CELPIP), work experience, spouse factors, and skill transferability.",
  keywords:
    "CRS calculator, CRS score, express entry score, IELTS CRS, CELPIP CLB, Canada PR score, comprehensive ranking system",
  openGraph: {
    title: "CRS Score Calculator | Canada Express Entry",
    description:
      "Free CRS calculator with IELTS/CELPIP support, spouse factors, and score breakdown.",
    url: "https://ircctracker.org/crs",
    siteName: "IRCC Tracker",
    type: "website",
  },
  alternates: {
    canonical: "https://ircctracker.org/crs",
  },
};

export default function CrsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
