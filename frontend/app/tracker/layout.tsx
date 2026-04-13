import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Permit Expiry Tracker | Work & Study Permit Renewal Dates | IRCC Tracker",
  description:
    "Track your Canadian work permit, study permit, visitor visa, or PR card expiry date. Get renewal deadlines, processing time estimates, and email reminders so you never miss your renewal.",
  keywords:
    "work permit expiry, study permit renewal, Canada permit tracker, PR card renewal, maintained status Canada, IRCC permit reminder",
  openGraph: {
    title: "Canada Permit Expiry Tracker | IRCC Tracker",
    description:
      "Enter your permit expiry date and get exact renewal deadlines + email reminders.",
    url: "https://ircctracker.org/tracker",
    siteName: "IRCC Tracker",
    type: "website",
  },
  alternates: {
    canonical: "https://ircctracker.org/tracker",
  },
};

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
