import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard } from "@/lib/og-card";

export const alt = "CLB Score Converter — IELTS, CELPIP, TEF, TCF — IRCC Tracker";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "CLB Score Converter",
    subtitle:
      "Turn IELTS, CELPIP, TEF Canada or TCF Canada results into Canadian Language Benchmarks and Express Entry CRS points.",
    emoji: "🔤",
    accent: "#06b6d4",
    badge: "FREE CONVERTER",
  });
}
