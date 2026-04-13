import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canada Proof of Funds Calculator 2025 | Express Entry & Study Permit | IRCC Tracker",
  description:
    "Calculate exactly how much money you need to show IRCC. Covers Express Entry (FSW), study permits, and visitor visas. See amounts in CAD, USD, INR, PHP, NGN, PKR, and more.",
  keywords:
    "proof of funds Canada, IRCC funds requirement, express entry funds, study permit funds, FSW settlement funds, Canada immigration money",
  openGraph: {
    title: "Canada Proof of Funds Calculator | IRCC Tracker",
    description:
      "Find out exactly how much money IRCC requires for your application — in your local currency.",
    url: "https://ircctracker.org/funds",
    siteName: "IRCC Tracker",
    type: "website",
  },
  alternates: {
    canonical: "https://ircctracker.org/funds",
  },
};

export default function FundsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
