"use client";

// The "What do you want to do?" hub at the top of the homepage.
// Four large cards instead of cramming the full Processing Times tool into /.
// New visitors decide their path here; everything else is one click away.

const PATHS = [
  {
    href: "/pathway",
    icon: "🌍",
    title: "Apply from outside Canada",
    sub: "Find the right immigration stream for you",
    cta: "Find my pathway",
    color: "#10b981",
  },
  {
    href: "/tracker",
    icon: "🇨🇦",
    title: "I'm already in Canada",
    sub: "Track your permit expiry, plan your renewal or PR",
    cta: "Track my permit",
    color: "#f97316",
  },
  {
    href: "/processing",
    icon: "⏱",
    title: "Just check processing times",
    sub: "Visa wait times for 180+ countries, refreshed daily",
    cta: "Check times",
    color: "#60a5fa",
  },
  {
    href: "/crs",
    icon: "🧮",
    title: "Calculate my CRS score",
    sub: "Score yourself against the latest Express Entry cut-off",
    cta: "Calculate score",
    color: "#8b5cf6",
  },
];

export default function ChooseYourPath() {
  return (
    <section>
      <h2 className="text-center text-lg sm:text-xl font-semibold text-white mb-1">
        What do you want to do?
      </h2>
      <p className="text-center text-sm text-gray-400 mb-5">
        Pick what fits — every tool is free, no account required
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {PATHS.map((p) => (
          <a
            key={p.href}
            href={p.href}
            className="canada-card p-5 sm:p-6 transition-all hover:border-white/20 group"
            style={{
              textDecoration: "none",
              borderColor: `${p.color}30`,
              background: `linear-gradient(135deg, ${p.color}0c, rgba(255,255,255,0.02))`,
            }}
          >
            <div className="flex items-start gap-4">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${p.color}22`,
                  border: `1px solid ${p.color}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "24px",
                }}
              >
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white">{p.title}</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{p.sub}</p>
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold mt-3 group-hover:translate-x-0.5 transition-transform"
                  style={{ color: p.color }}
                >
                  {p.cta}
                  <span aria-hidden>→</span>
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
