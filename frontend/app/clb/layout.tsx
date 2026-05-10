import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CLB Score Converter | IELTS, CELPIP, TEF, TCF → CLB | IRCC Tracker",
  description:
    "Convert IELTS, CELPIP, TEF Canada, or TCF Canada scores to Canadian Language Benchmarks (CLB) and Express Entry CRS points. Per-skill conversion, free, no signup.",
  keywords:
    "CLB converter, IELTS to CLB, CELPIP to CLB, TEF Canada CLB, TCF Canada CLB, Express Entry language points, NCLC converter",
  openGraph: {
    title: "CLB Score Converter | IELTS, CELPIP, TEF, TCF",
    description:
      "Turn your IELTS, CELPIP, TEF or TCF scores into CLB and CRS points — free, instant, per-skill.",
    url: "https://ircctracker.org/clb",
    siteName: "IRCC Tracker",
    type: "website",
  },
  alternates: {
    canonical: "https://ircctracker.org/clb",
  },
};

export default function ClbLayout({ children }: { children: React.ReactNode }) {
  return children;
}
