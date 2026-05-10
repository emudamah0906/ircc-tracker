import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canada Visa Document Checklist 2025 | 8 Visa Types | IRCC Tracker",
  description:
    "Per-visa-type document checklists for FSW, CEC, FST, Work Permit, Study Permit, Visitor Visa, Spousal Sponsorship, and PNP. Tick boxes save automatically — never lose your place.",
  keywords:
    "Canada visa documents, FSW document checklist, CEC documents, study permit documents, work permit checklist, visitor visa checklist, spousal sponsorship documents",
  openGraph: {
    title: "Canada Visa Document Checklist | Free | IRCC Tracker",
    description:
      "Per-stream document lists for 8 visa types. Save your progress automatically.",
    url: "https://ircctracker.org/checklist",
    siteName: "IRCC Tracker",
    type: "website",
  },
  alternates: {
    canonical: "https://ircctracker.org/checklist",
  },
};

export default function ChecklistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
