import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard } from "@/lib/og-card";

export const alt = "PR Pathway Finder — find your best Canada immigration stream — IRCC Tracker";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "PR Pathway Finder",
    subtitle:
      "8-question quiz that matches you to the right Canadian PR stream — Express Entry, PNP, CEC, FSW, Atlantic, Rural, and more.",
    emoji: "🗺️",
    accent: "#10b981",
    badge: "FREE QUIZ",
  });
}
