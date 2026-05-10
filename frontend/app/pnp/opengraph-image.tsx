import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard } from "@/lib/og-card";

export const alt = "Provincial Nominee Program Tracker — 9 provinces — IRCC Tracker";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "PNP Tracker — 9 Provinces",
    subtitle:
      "Ontario, BC, Alberta, Saskatchewan, Manitoba, Nova Scotia, NB, PEI, NL — all streams, requirements, and recent draws in one place.",
    emoji: "🏛️",
    accent: "#6366f1",
    badge: "PROVINCIAL NOMINEE",
  });
}
