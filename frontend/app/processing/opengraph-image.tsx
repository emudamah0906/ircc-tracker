import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard } from "@/lib/og-card";

export const alt = "Canada Visa Processing Times — 180+ countries — IRCC Tracker";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Canada Visa Wait Times",
    subtitle:
      "Visa processing times for 180+ countries — visitor visa, work permit, study permit, PR — refreshed daily from IRCC.",
    emoji: "⏱",
    accent: "#60a5fa",
    badge: "DAILY UPDATES",
  });
}
