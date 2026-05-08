// Single source of truth for tool metadata.
// Used by Header, ToolShowcase, About, mobile menu, and homepage tool grid.
// When adding/renaming a tool, update here only.

export type ToolKey =
  | "processing"
  | "draws"
  | "crs"
  | "pathway"
  | "pnp"
  | "tracker"
  | "funds"
  | "clb"
  | "noc"
  | "checklist"
  | "dashboard"
  | "news"
  | "about"
  | "pricing";

export type ToolGroup = "track" | "calculate" | "plan";

export type Tool = {
  key: ToolKey;
  href: string;
  icon: string;
  /** Short label shown in nav tabs */
  label: string;
  /** Short tagline shown under nav-dropdown items and in mobile menu (max ~40 chars) */
  short: string;
  /** Full one-liner used on homepage cards and About page */
  long: string;
  /** Used to color the icon chip in dropdowns */
  color: string;
  group: ToolGroup;
};

export const TOOLS: Record<ToolKey, Tool> = {
  processing: {
    key: "processing",
    href: "/processing",
    icon: "⏱",
    label: "Processing Times",
    short: "Visa wait times by country",
    long: "Visa wait times for 180+ countries, refreshed daily from IRCC.",
    color: "#60a5fa",
    group: "track",
  },
  draws: {
    key: "draws",
    href: "/draws",
    icon: "🗳",
    label: "PR Draws",
    short: "Express Entry & Provincial",
    long: "Every Express Entry & Provincial Nominee draw, the moment IRCC publishes it.",
    color: "#d52b1e",
    group: "track",
  },
  news: {
    key: "news",
    href: "/news",
    icon: "📰",
    label: "IRCC News",
    short: "Official immigration news",
    long: "Official IRCC announcements, with plain-English summaries.",
    color: "#94a3b8",
    group: "track",
  },
  tracker: {
    key: "tracker",
    href: "/tracker",
    icon: "⏰",
    label: "Permit Expiry Tracker",
    short: "Never miss a renewal",
    long: "Get notified before your work, study, visitor, or PR card expires — and know when to start renewing.",
    color: "#f97316",
    group: "track",
  },
  crs: {
    key: "crs",
    href: "/crs",
    icon: "🧮",
    label: "CRS Calculator",
    short: "Score yourself for Express Entry",
    long: "Calculate your Comprehensive Ranking System score and compare against the latest cut-off in 60 seconds.",
    color: "#8b5cf6",
    group: "calculate",
  },
  clb: {
    key: "clb",
    href: "/clb",
    icon: "🔤",
    label: "CLB Converter",
    short: "IELTS / CELPIP / TEF / TCF → CLB",
    long: "Turn your IELTS, CELPIP, TEF, or TCF results into Canadian Language Benchmarks and CRS points.",
    color: "#06b6d4",
    group: "calculate",
  },
  funds: {
    key: "funds",
    href: "/funds",
    icon: "💰",
    label: "Proof of Funds",
    short: "How much money IRCC needs to see",
    long: "Calculate the settlement funds IRCC requires for Express Entry, study, or visitor applications, in your currency.",
    color: "#eab308",
    group: "calculate",
  },
  noc: {
    key: "noc",
    href: "/noc",
    icon: "🔍",
    label: "NOC Code Finder",
    short: "Find your NOC 2021 code",
    long: "Look up your NOC 2021 code and check Express Entry / TEER eligibility for your job.",
    color: "#ec4899",
    group: "calculate",
  },
  pathway: {
    key: "pathway",
    href: "/pathway",
    icon: "🗺️",
    label: "PR Pathway Finder",
    short: "Which stream fits you?",
    long: "Answer 8 questions and we'll show you which immigration streams match your profile.",
    color: "#10b981",
    group: "plan",
  },
  pnp: {
    key: "pnp",
    href: "/pnp",
    icon: "🏛️",
    label: "PNP Tracker",
    short: "Provincial nominee streams",
    long: "Explore Provincial Nominee Program streams for Ontario, BC, and Alberta — eligibility and typical CRS thresholds.",
    color: "#6366f1",
    group: "plan",
  },
  checklist: {
    key: "checklist",
    href: "/checklist",
    icon: "📋",
    label: "Document Checklist",
    short: "Know what to submit",
    long: "Personalized document checklist by visa type — track what you've gathered so nothing slips.",
    color: "#14b8a6",
    group: "plan",
  },
  dashboard: {
    key: "dashboard",
    href: "/dashboard",
    icon: "📊",
    label: "My Dashboard",
    short: "Your saved CRS profile",
    long: "Save your CRS profile, see how you compare to recent draws, and get score-improvement tips.",
    color: "#a855f7",
    group: "plan",
  },
  about: {
    key: "about",
    href: "/about",
    icon: "🍁",
    label: "About",
    short: "Why we built this",
    long: "Free Canada immigration tools, built by an immigrant for the next wave.",
    color: "#d52b1e",
    group: "plan",
  },
  pricing: {
    key: "pricing",
    href: "/pricing",
    icon: "✨",
    label: "Pricing",
    short: "Free vs Pro",
    long: "Pricing options for IRCC Tracker.",
    color: "#facc15",
    group: "plan",
  },
};

/** Top-level nav items shown in desktop header (in order). */
export const HEADER_PRIMARY: ToolKey[] = ["processing", "draws", "crs"];

/** Items in the "More Tools" dropdown (in order). */
export const HEADER_MORE: ToolKey[] = [
  "pathway",
  "pnp",
  "tracker",
  "funds",
  "clb",
  "noc",
  "checklist",
  "dashboard",
  "news",
  "about",
];

/** Tools grid shown on homepage and About page (in order). */
export const ALL_TOOLS: ToolKey[] = [
  "processing",
  "draws",
  "crs",
  "pathway",
  "pnp",
  "tracker",
  "clb",
  "noc",
  "checklist",
  "funds",
  "news",
];

/** Mobile menu sections (matches `group` field). */
export const MOBILE_GROUPS: { title: string; group: ToolGroup; keys: ToolKey[] }[] = [
  { title: "Track", group: "track", keys: ["processing", "draws", "news", "tracker"] },
  { title: "Calculate", group: "calculate", keys: ["crs", "clb", "funds", "noc"] },
  { title: "Plan", group: "plan", keys: ["pathway", "pnp", "checklist", "dashboard"] },
];
