import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canada Visa Processing Times 2025 | 180+ Countries | IRCC Tracker",
  description:
    "Live Canada visa processing times for 180+ countries — visitor visa, work permit, study permit, Express Entry PR, spousal sponsorship, citizenship. Refreshed daily from IRCC.",
  keywords:
    "Canada visa processing times, IRCC processing times, work permit wait time, study permit Canada, visitor visa Canada, Express Entry processing time",
  openGraph: {
    title: "Canada Visa Processing Times | Live IRCC Data",
    description:
      "Live processing times for 180+ countries. Visitor, work, study, PR, spousal — refreshed daily.",
    url: "https://ircctracker.org/processing",
    siteName: "IRCC Tracker",
    type: "website",
  },
  alternates: {
    canonical: "https://ircctracker.org/processing",
  },
};

export default function ProcessingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
