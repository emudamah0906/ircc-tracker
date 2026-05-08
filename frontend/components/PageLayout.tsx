"use client";

import Header, { type ActiveNav } from "@/components/Header";
import Footer from "@/components/Footer";
import JourneyProgress from "@/components/JourneyProgress";

// Map activeNav values to journey slugs
const NAV_TO_SLUG: Record<string, string> = {
  home: "processing",
  processing: "processing",
  draws: "draws",
  crs: "crs",
  pathway: "pathway",
  tracker: "tracker",
  funds: "funds",
  dashboard: "dashboard",
};

export default function PageLayout({
  children,
  subtitle,
  activeNav,
  lastUpdated,
}: {
  children: React.ReactNode;
  subtitle?: string;
  activeNav?: ActiveNav;
  lastUpdated?: string | null;
}) {
  const journeySlug = activeNav ? NAV_TO_SLUG[activeNav] : undefined;

  return (
    <div className="canada-bg text-white">
      <Header subtitle={subtitle} activeNav={activeNav} lastUpdated={lastUpdated} />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {journeySlug && <JourneyProgress currentSlug={journeySlug} />}
        {children}
      </main>
      <Footer />
    </div>
  );
}
