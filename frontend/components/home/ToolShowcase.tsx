"use client";

const TOOLS = [
  {
    href: "/",
    icon: "⏱",
    title: "Processing Times",
    description: "Check visa wait times for 180+ countries, updated daily from IRCC",
  },
  {
    href: "/draws",
    icon: "🗳",
    title: "PR Draws",
    description: "Latest Express Entry and Provincial Nominee draw results & trends",
  },
  {
    href: "/crs",
    icon: "🧮",
    title: "CRS Calculator",
    description: "Calculate your Comprehensive Ranking System score for Express Entry",
  },
  {
    href: "/pathway",
    icon: "🗺️",
    title: "PR Pathway Finder",
    description: "Answer 8 questions to find the best immigration stream for you",
  },
  {
    href: "/tracker",
    icon: "⏰",
    title: "Permit Expiry Tracker",
    description: "Know exactly when to renew your work, study, or visitor permit",
  },
  {
    href: "/funds",
    icon: "💰",
    title: "Proof of Funds",
    description: "Calculate how much money you need to show IRCC for your application",
  },
];

export default function ToolShowcase() {
  return (
    <section>
      <h2 className="text-center text-lg font-semibold text-white mb-5">
        Free Immigration Tools
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((tool) => (
          <a
            key={tool.href}
            href={tool.href}
            className="canada-feature-card"
          >
            <div className="text-2xl mb-3">{tool.icon}</div>
            <h3 className="text-sm font-bold text-white mb-1">{tool.title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{tool.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
