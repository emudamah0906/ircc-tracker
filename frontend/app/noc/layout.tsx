import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NOC Code Finder 2025 | TEER Levels & Express Entry | IRCC Tracker",
  description:
    "Find your NOC 2021 code, TEER level, and Express Entry eligibility in seconds. 70+ codes covered — search by job title or category.",
  keywords:
    "NOC code finder, NOC 2021, TEER levels, Express Entry NOC, Canadian job classification, find my NOC",
  openGraph: {
    title: "NOC Code Finder | Canada Express Entry",
    description:
      "Find your NOC 2021 code and TEER level in seconds. Free, 70+ codes searchable.",
    url: "https://ircctracker.org/noc",
    siteName: "IRCC Tracker",
    type: "website",
  },
  alternates: {
    canonical: "https://ircctracker.org/noc",
  },
};

export default function NocLayout({ children }: { children: React.ReactNode }) {
  return children;
}
