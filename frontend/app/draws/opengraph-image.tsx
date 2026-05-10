import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard } from "@/lib/og-card";

export const alt = "Latest Express Entry Draws — Live IRCC Tracker";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Express Entry Draws",
    subtitle:
      "Every Express Entry & Provincial Nominee draw, the moment IRCC publishes it. CRS cutoffs, ITAs issued, full history.",
    emoji: "🗳",
    accent: "#d52b1e",
    badge: "LIVE TRACKER",
  });
}
