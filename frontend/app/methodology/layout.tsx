import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How IRCC Tracker Works | Methodology, Sources & Limits",
  description:
    "Where every number on IRCC Tracker comes from, how often we refresh it, and what we don't do. Direct links to our IRCC source data, our 6-hour update cadence, and the regulatory limits we operate within.",
  keywords:
    "IRCC Tracker methodology, IRCC data sources, immigration data accuracy, canada.ca data feeds, ircc tracker about",
  openGraph: {
    title: "How IRCC Tracker Works | Methodology",
    description:
      "Real data sources, real refresh cadence, no fabricated stats. Read this before trusting any number on the site.",
    url: "https://ircctracker.org/methodology",
    siteName: "IRCC Tracker",
    type: "website",
  },
  alternates: {
    canonical: "https://ircctracker.org/methodology",
  },
};

export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
