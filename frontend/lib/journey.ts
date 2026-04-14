export type JourneyType = "outside" | "inside";

const JOURNEY_KEY = "ircc_journey_type";
const COMPLETED_KEY = "ircc_completed_tools";

export function getJourneyType(): JourneyType | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(JOURNEY_KEY) as JourneyType | null;
}

export function setJourneyType(type: JourneyType) {
  if (typeof window === "undefined") return;
  localStorage.setItem(JOURNEY_KEY, type);
}

export function getCompletedTools(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(COMPLETED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function markToolCompleted(slug: string) {
  if (typeof window === "undefined") return;
  const completed = getCompletedTools();
  if (!completed.includes(slug)) {
    completed.push(slug);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed));
  }
}

export const JOURNEY_STEPS = {
  outside: [
    { slug: "pathway", label: "Pathway Finder", href: "/pathway", icon: "🗺️" },
    { slug: "crs", label: "CRS Calculator", href: "/crs", icon: "🧮" },
    { slug: "draws", label: "PR Draws", href: "/draws", icon: "🗳" },
    { slug: "processing", label: "Processing Times", href: "/", icon: "⏱" },
  ],
  inside: [
    { slug: "tracker", label: "Permit Tracker", href: "/tracker", icon: "⏰" },
    { slug: "processing", label: "Processing Times", href: "/", icon: "⏱" },
    { slug: "dashboard", label: "Dashboard", href: "/dashboard", icon: "📊" },
  ],
};
