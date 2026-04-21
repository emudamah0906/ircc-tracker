"use client";

export default function HeroSection({
  onScrollToProcessing,
}: {
  onScrollToProcessing: () => void;
}) {
  return (
    <section className="canada-hero rounded-2xl" style={{ paddingBottom: 40 }}>

      {/* Live badge */}
      <div className="flex justify-center mb-4">
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#34d399",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", background: "#10b981",
            display: "inline-block",
            boxShadow: "0 0 0 0 rgba(16,185,129,0.4)",
            animation: "pulse-dot 2s infinite",
          }} />
          Live data · Updated daily from IRCC
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        Your Canada Immigration<br className="hidden sm:block" />{" "}
        <span style={{ color: "#d52b1e" }}>Command Centre</span>
      </h1>
      <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-7">
        CRS calculator, processing times, draw history, and 10 free tools — all in one place. No lawyer needed to get started.
      </p>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7 max-w-2xl mx-auto">
        {[
          { value: "180+", label: "Countries Tracked", color: "#60a5fa", icon: "🌐" },
          { value: "10", label: "Free Tools", color: "#4ade80", icon: "🛠" },
          { value: "Daily", label: "Data Updates", color: "#facc15", icon: "⚡" },
          { value: "Free", label: "No Credit Card", color: "#f472b6", icon: "🔓" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(8px)",
          }}>
            <div className="text-lg mb-0.5">{s.icon}</div>
            <p className="text-lg font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <a
          href="/pathway"
          className="canada-btn px-6 py-3 text-sm text-center"
          style={{ textDecoration: "none", boxShadow: "0 4px 20px rgba(213,43,30,0.35)" }}
        >
          Find My PR Pathway →
        </a>
        <button
          onClick={onScrollToProcessing}
          className="canada-pill px-6 py-3 text-sm"
        >
          Check Processing Times
        </button>
      </div>

      {/* Tool quick-links */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
        {[
          { href: "/crs", label: "CRS Calculator", color: "#8b5cf6" },
          { href: "/clb", label: "CLB Converter", color: "#06b6d4" },
          { href: "/draws", label: "PR Draws", color: "#d52b1e" },
          { href: "/funds", label: "Proof of Funds", color: "#eab308" },
          { href: "/checklist", label: "Document Checklist", color: "#14b8a6" },
        ].map(({ href, label, color }) => (
          <a key={href} href={href} style={{
            textDecoration: "none", fontSize: 11, fontWeight: 500,
            padding: "4px 12px", borderRadius: 999,
            background: `${color}18`, border: `1px solid ${color}33`, color,
            transition: "all 0.2s",
          }}>
            {label}
          </a>
        ))}
      </div>
    </section>
  );
}
