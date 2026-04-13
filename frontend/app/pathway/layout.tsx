import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canada PR Pathway Finder 2025 | Which Stream Fits You? | IRCC Tracker",
  description:
    "Find the best Canada permanent residence pathway for your profile. Compare Express Entry (CEC, FSW, FST), Provincial Nominee Programs (PNP), Atlantic Immigration, and spousal sponsorship.",
  keywords:
    "Canada PR pathway, express entry eligibility, PNP Canada, CEC eligibility, FSW requirements, Atlantic Immigration Program, Canada permanent residence",
  openGraph: {
    title: "Canada PR Pathway Finder | IRCC Tracker",
    description:
      "Answer 8 quick questions to find which Canada PR stream you qualify for.",
    url: "https://ircctracker.org/pathway",
    siteName: "IRCC Tracker",
    type: "website",
  },
  alternates: {
    canonical: "https://ircctracker.org/pathway",
  },
};

export default function PathwayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
