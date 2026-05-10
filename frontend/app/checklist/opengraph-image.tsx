import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard } from "@/lib/og-card";

export const alt = "Canada Visa Document Checklist — 8 visa types — IRCC Tracker";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    title: "Document Checklist",
    subtitle:
      "Per-stream document lists for FSW, CEC, FST, Work Permit, Study, Visitor, Spousal, and PNP. Tick boxes save automatically.",
    emoji: "📋",
    accent: "#14b8a6",
    badge: "FREE CHECKLIST",
  });
}
