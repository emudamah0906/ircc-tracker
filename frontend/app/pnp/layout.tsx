import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PNP Tracker 2025 | 9 Provinces | All Streams | IRCC Tracker",
  description:
    "Provincial Nominee Program tracker covering Ontario (OINP), BC PNP, Alberta AAIP, Saskatchewan, Manitoba, Nova Scotia, NB, PEI, NL — every stream, requirement, and recent draw.",
  keywords:
    "PNP tracker, Provincial Nominee Program, OINP, BC PNP, AAIP, SINP, MPNP, NSNP, NB PNP, PEI PNP, NL PNP, PNP draws",
  openGraph: {
    title: "PNP Tracker — 9 Provinces | IRCC Tracker",
    description:
      "Every Canadian Provincial Nominee Program stream, eligibility, and recent draws — in one place. Free.",
    url: "https://ircctracker.org/pnp",
    siteName: "IRCC Tracker",
    type: "website",
  },
  alternates: {
    canonical: "https://ircctracker.org/pnp",
  },
};

export default function PnpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
