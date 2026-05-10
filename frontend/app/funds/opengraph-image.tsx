import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard } from "@/lib/og-card";

export const alt = "Canada Proof of Funds Calculator — Express Entry / FSW — IRCC Tracker";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Proof of Funds",
    subtitle:
      "How much money IRCC requires for Federal Skilled Worker / FST applications by family size. Updated every June.",
    emoji: "💰",
    accent: "#eab308",
    badge: "FSW REQUIREMENTS",
  });
}
