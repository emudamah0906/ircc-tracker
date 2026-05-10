import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard } from "@/lib/og-card";

export const alt = "How IRCC Tracker works — sources, cadence, non-affiliation";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "How IRCC Tracker works",
    subtitle:
      "Real data sources from canada.ca, real refresh cadence, no fabricated stats. Read before trusting any number on the site.",
    emoji: "📡",
    accent: "#10b981",
    badge: "METHODOLOGY",
  });
}
