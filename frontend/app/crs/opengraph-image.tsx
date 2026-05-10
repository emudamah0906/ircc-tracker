import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard } from "@/lib/og-card";

export const alt = "Free CRS Score Calculator for Canada Express Entry — IRCC Tracker";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "CRS Score Calculator",
    subtitle:
      "Estimate your Express Entry score in 2 minutes. IELTS, CELPIP, TEF & TCF supported. Spouse, French bonus, skill transferability — all calculated.",
    emoji: "🧮",
    accent: "#8b5cf6",
    badge: "FREE CALCULATOR",
  });
}
