import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard } from "@/lib/og-card";

export const alt = "NOC Code Finder — TEER levels & Express Entry eligibility — IRCC Tracker";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "NOC Code Finder",
    subtitle:
      "70+ NOC 2021 codes with TEER levels and Express Entry eligibility — find the right code for your job in seconds.",
    emoji: "🔍",
    accent: "#ec4899",
    badge: "FREE LOOKUP",
  });
}
