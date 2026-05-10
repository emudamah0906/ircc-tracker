import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard } from "@/lib/og-card";

export const alt = "Canada Permit Expiry Tracker — never miss a renewal — IRCC Tracker";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Permit Expiry Tracker",
    subtitle:
      "Track your Canadian study, work, or visitor permit. Get reminders before it expires so you never have to leave the country.",
    emoji: "⏰",
    accent: "#f97316",
    badge: "FREE REMINDERS",
  });
}
