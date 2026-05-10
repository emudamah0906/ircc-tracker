import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard } from "@/lib/og-card";

export const alt = "IRCC Tracker — Free Canada immigration tools";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Free Canada immigration tools",
    subtitle:
      "CRS calculator, Express Entry draws, PNP tracker, processing times — auto-updated from IRCC.",
    emoji: "🍁",
    accent: "#d52b1e",
    badge: "IRCC TRACKER",
  });
}
